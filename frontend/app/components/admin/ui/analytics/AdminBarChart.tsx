'use client'

import React, { useState, useCallback, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Download, 
  RotateCcw, 
  BarChart3,
  BarChart2,
  Eye,
  EyeOff,
  ArrowUpDown,
  Filter
} from 'lucide-react'
import { ChartTooltip } from './ChartTooltip'
import { ChartLegend } from './ChartLegend'

export interface BarDataPoint {
  /** Category name for X-axis */
  category: string
  /** Numeric values for different metrics */
  [key: string]: string | number
}

export interface BarSeriesConfig {
  /** Data key for the series */
  dataKey: string
  /** Display name for the series */
  name: string
  /** Bar color (hex or CSS color) */
  color: string
  /** Bar opacity */
  opacity?: number
  /** Whether series is visible */
  visible?: boolean
  /** HIPAA compliance level for healthcare data */
  hipaaCompliance?: 'public' | 'restricted' | 'phi'
  /** Custom bar radius */
  radius?: number
  /** Stack ID for stacked bars */
  stackId?: string
}

export interface AdminBarChartProps {
  /** Chart data array */
  data: BarDataPoint[]
  /** Configuration for each bar series */
  series: BarSeriesConfig[]
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
  /** Whether to show export controls */
  showExport?: boolean
  /** Whether to animate chart on load */
  animate?: boolean
  /** Chart layout orientation */
  layout?: 'horizontal' | 'vertical'
  /** Bar chart type */
  chartType?: 'grouped' | 'stacked' | 'percentage'
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
  /** Sort options */
  sortBy?: 'category' | 'value' | 'none'
  /** Sort direction */
  sortDirection?: 'asc' | 'desc'
  /** Filter minimum value */
  minValue?: number
  /** Maximum number of bars to display */
  maxBars?: number
  /** Callback when exporting data */
  onExport?: (format: 'png' | 'svg' | 'csv') => void
  /** Callback when bar is clicked */
  onBarClick?: (data: BarDataPoint, seriesKey: string) => void
  /** Custom CSS classes */
  className?: string
}

/**
 * AdminBarChart - Healthcare-compliant bar chart component for admin analytics
 * 
 * Features:
 * - Grouped, stacked, and percentage bar charts
 * - Interactive tooltips with healthcare-specific formatting
 * - Export functionality (PNG, SVG, CSV)
 * - HIPAA compliance mode for PHI data
 * - Responsive design with accessibility features
 * - Sorting and filtering capabilities
 * - Reference lines for benchmarks
 * - Horizontal and vertical orientations
 * 
 * @example
 * ```tsx
 * const data = [
 *   { department: 'Cardiology', patients: 120, screenings: 45 },
 *   { department: 'Oncology', patients: 98, screenings: 38 },
 * ]
 * 
 * const series = [
 *   { dataKey: 'patients', name: 'Patient Count', color: '#0ea5e9', hipaaCompliance: 'restricted' },
 *   { dataKey: 'screenings', name: 'Screenings', color: '#10b981', hipaaCompliance: 'phi' },
 * ]
 * 
 * <AdminBarChart 
 *   data={data} 
 *   series={series}
 *   title="Department Performance"
 *   chartType="grouped"
 *   hipaaMode={true}
 *   showExport={true}
 * />
 * ```
 */
export function AdminBarChart({
  data,
  series,
  title,
  description,
  height = 400,
  xAxisLabel,
  yAxisLabel,
  showGrid = true,
  showExport = true,
  animate = true,
  layout = 'vertical',
  chartType = 'grouped',
  referenceLines = [],
  colorScheme = 'healthcare',
  hipaaMode = false,
  loading = false,
  error,
  sortBy = 'none',
  sortDirection = 'desc',
  minValue,
  maxBars,
  onExport,
  onBarClick,
  className = ''
}: AdminBarChartProps) {
  const [visibleSeries, setVisibleSeries] = useState<Record<string, boolean>>(
    series.reduce((acc, s) => ({ ...acc, [s.dataKey]: s.visible !== false }), {})
  )
  const [currentSortBy, setCurrentSortBy] = useState(sortBy)
  const [currentSortDirection, setCurrentSortDirection] = useState(sortDirection)

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
      color: s.color || colors[index % colors.length]
    }))
  }, [series, colorScheme])

  // Filter and sort data
  const processedData = useMemo(() => {
    let processed = [...data]

    // Filter by minimum value if specified
    if (minValue !== undefined) {
      processed = processed.filter(item => {
        return series.some(s => (item[s.dataKey] as number) >= minValue)
      })
    }

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

    // Sort data
    if (currentSortBy !== 'none') {
      processed.sort((a, b) => {
        let aVal: number | string
        let bVal: number | string

        if (currentSortBy === 'category') {
          aVal = a.category
          bVal = b.category
        } else {
          // Sort by the first visible series value
          const firstVisibleSeries = series.find(s => visibleSeries[s.dataKey])
          if (firstVisibleSeries) {
            aVal = a[firstVisibleSeries.dataKey] as number
            bVal = b[firstVisibleSeries.dataKey] as number
          } else {
            return 0
          }
        }

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return currentSortDirection === 'asc' 
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal)
        } else {
          return currentSortDirection === 'asc' 
            ? (aVal as number) - (bVal as number)
            : (bVal as number) - (aVal as number)
        }
      })
    }

    // Limit number of bars
    if (maxBars && maxBars > 0) {
      processed = processed.slice(0, maxBars)
    }

    return processed
  }, [data, series, hipaaMode, currentSortBy, currentSortDirection, visibleSeries, minValue, maxBars])

  // Calculate totals for percentage chart
  const dataWithPercentages = useMemo(() => {
    if (chartType !== 'percentage') return processedData

    return processedData.map(item => {
      const total = series.reduce((sum, s) => {
        if (visibleSeries[s.dataKey]) {
          return sum + (item[s.dataKey] as number || 0)
        }
        return sum
      }, 0)

      const withPercentages = { ...item }
      series.forEach(s => {
        if (visibleSeries[s.dataKey] && total > 0) {
          withPercentages[`${s.dataKey}_percent`] = ((item[s.dataKey] as number || 0) / total) * 100
        }
      })
      return withPercentages
    })
  }, [processedData, series, visibleSeries, chartType])

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

  // Toggle sort
  const toggleSort = useCallback(() => {
    if (currentSortBy === 'none') {
      setCurrentSortBy('value')
      setCurrentSortDirection('desc')
    } else if (currentSortBy === 'value' && currentSortDirection === 'desc') {
      setCurrentSortDirection('asc')
    } else if (currentSortBy === 'value' && currentSortDirection === 'asc') {
      setCurrentSortBy('category')
      setCurrentSortDirection('asc')
    } else {
      setCurrentSortBy('none')
      setCurrentSortDirection('desc')
    }
  }, [currentSortBy, currentSortDirection])

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
  const chartData = chartType === 'percentage' ? dataWithPercentages : processedData

  return (
    <Card className={`w-full ${className}`}>
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
            
            <Badge variant="outline" className="text-xs">
              {chartType}
            </Badge>
            
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSort}
                className="h-8 px-2"
                title="Toggle sorting"
              >
                <ArrowUpDown className="h-3 w-3" />
              </Button>
              
              {minValue !== undefined && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2"
                  title={`Filtered by min value: ${minValue}`}
                >
                  <Filter className="h-3 w-3" />
                </Button>
              )}
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

        {/* Series Legend */}
        <div className="flex flex-wrap gap-4 pt-2">
          {seriesWithColors.map(s => {
            const isVisible = visibleSeries[s.dataKey]
            
            return (
              <div
                key={s.dataKey}
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => toggleSeries(s.dataKey)}
              >
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: isVisible ? s.color : '#e5e7eb' }}
                />
                <span className={`text-sm font-medium ${!isVisible ? 'text-gray-400' : ''}`}>
                  {s.name}
                </span>
                <Button variant="ghost" size="sm" className="h-4 p-0">
                  {isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                </Button>
              </div>
            )
          })}
        </div>

        {/* Sort indicator */}
        {currentSortBy !== 'none' && (
          <div className="text-xs text-gray-500 pt-2">
            Sorted by {currentSortBy} ({currentSortDirection})
            {maxBars && ` • Showing top ${maxBars}`}
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="w-full" style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout={layout}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              {showGrid && (
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#f0f0f0"
                  opacity={0.6}
                />
              )}
              
              <XAxis 
                type={layout === 'vertical' ? 'category' : 'number'}
                dataKey={layout === 'vertical' ? 'category' : undefined}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
                angle={layout === 'vertical' ? -45 : 0}
                textAnchor={layout === 'vertical' ? 'end' : 'middle'}
                label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -10 } : undefined}
              />
              
              <YAxis 
                type={layout === 'vertical' ? 'number' : 'category'}
                dataKey={layout === 'horizontal' ? 'category' : undefined}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
                label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
              />

              <ChartTooltip 
                hipaaMode={hipaaMode}
                colorScheme={colorScheme}
                formatter={(value, name) => {
                  if (chartType === 'percentage' && name.includes('_percent')) {
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
                  y={layout === 'vertical' ? line.value : undefined}
                  x={layout === 'horizontal' ? line.value : undefined}
                  stroke={line.color}
                  strokeDasharray={line.strokeDasharray || "5 5"}
                  label={{ value: line.label, position: "topRight" }}
                />
              ))}

              {/* Data Bars */}
              {seriesWithColors.map(s => {
                if (!visibleSeries[s.dataKey]) return null

                const dataKey = chartType === 'percentage' ? `${s.dataKey}_percent` : s.dataKey
                const stackId = chartType === 'stacked' || chartType === 'percentage' ? 'stack' : s.stackId

                return (
                  <Bar
                    key={s.dataKey}
                    dataKey={dataKey}
                    fill={s.color}
                    opacity={s.opacity || 0.8}
                    radius={s.radius || [2, 2, 0, 0]}
                    stackId={stackId}
                    animationDuration={animate ? 1000 : 0}
                    onClick={(data, index) => onBarClick?.(data, s.dataKey)}
                  >
                    {/* Individual bar colors for special cases */}
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={s.color}
                        opacity={s.opacity || 0.8}
                      />
                    ))}
                  </Bar>
                )
              })}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export default AdminBarChart