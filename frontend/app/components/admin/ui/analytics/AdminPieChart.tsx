'use client'

import React, { useState, useCallback, useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Sector,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Download, 
  PieChart as PieChartIcon,
  Donut,
  Eye,
  EyeOff,
  ArrowUpDown,
  Percent
} from 'lucide-react'
import { ChartTooltip } from './ChartTooltip'

export interface PieDataPoint {
  /** Category name */
  name: string
  /** Numeric value */
  value: number
  /** Optional category color override */
  color?: string
  /** HIPAA compliance level for healthcare data */
  hipaaCompliance?: 'public' | 'restricted' | 'phi'
  /** Additional metadata */
  metadata?: Record<string, any>
}

export interface AdminPieChartProps {
  /** Chart data array */
  data: PieDataPoint[]
  /** Chart title */
  title: string
  /** Chart description */
  description?: string
  /** Height of the chart container */
  height?: number
  /** Width of the chart container */
  width?: number
  /** Whether to show legend */
  showLegend?: boolean
  /** Whether to show percentages */
  showPercentages?: boolean
  /** Whether to show values */
  showValues?: boolean
  /** Whether to show export controls */
  showExport?: boolean
  /** Whether to animate chart on load */
  animate?: boolean
  /** Chart type */
  chartType?: 'pie' | 'donut'
  /** Inner radius for donut chart (0-100) */
  innerRadius?: number
  /** Outer radius (0-100) */
  outerRadius?: number
  /** Custom color scheme for healthcare compliance */
  colorScheme?: 'default' | 'healthcare' | 'accessible'
  /** HIPAA compliance mode */
  hipaaMode?: boolean
  /** Loading state */
  loading?: boolean
  /** Error state */
  error?: string
  /** Sort options */
  sortBy?: 'name' | 'value' | 'none'
  /** Sort direction */
  sortDirection?: 'asc' | 'desc'
  /** Minimum value threshold to display */
  minValue?: number
  /** Maximum number of segments */
  maxSegments?: number
  /** Whether segments can be hidden */
  allowHide?: boolean
  /** Active segment index for highlighting */
  activeIndex?: number
  /** Legend position */
  legendPosition?: 'top' | 'bottom' | 'left' | 'right'
  /** Callback when exporting data */
  onExport?: (format: 'png' | 'svg' | 'csv') => void
  /** Callback when segment is clicked */
  onSegmentClick?: (data: PieDataPoint, index: number) => void
  /** Callback when segment is hovered */
  onSegmentHover?: (data: PieDataPoint | null, index: number | null) => void
  /** Custom CSS classes */
  className?: string
}

/**
 * AdminPieChart - Healthcare-compliant pie/donut chart component for admin analytics
 * 
 * Features:
 * - Pie and donut chart variations
 * - Interactive tooltips with healthcare-specific formatting
 * - Export functionality (PNG, SVG, CSV)
 * - HIPAA compliance mode for PHI data
 * - Responsive design with accessibility features
 * - Active segment highlighting
 * - Customizable colors and themes
 * - Sorting and filtering capabilities
 * 
 * @example
 * ```tsx
 * const data = [
 *   { name: 'Cardiology', value: 120, hipaaCompliance: 'restricted' },
 *   { name: 'Oncology', value: 98, hipaaCompliance: 'phi' },
 *   { name: 'Emergency', value: 87, hipaaCompliance: 'public' },
 * ]
 * 
 * <AdminPieChart 
 *   data={data} 
 *   title="Patient Distribution by Department"
 *   chartType="donut"
 *   showPercentages={true}
 *   hipaaMode={true}
 *   showExport={true}
 * />
 * ```
 */
export function AdminPieChart({
  data,
  title,
  description,
  height = 400,
  width,
  showLegend = true,
  showPercentages = true,
  showValues = false,
  showExport = true,
  animate = true,
  chartType = 'pie',
  innerRadius = chartType === 'donut' ? 40 : 0,
  outerRadius = 80,
  colorScheme = 'healthcare',
  hipaaMode = false,
  loading = false,
  error,
  sortBy = 'value',
  sortDirection = 'desc',
  minValue,
  maxSegments,
  allowHide = true,
  activeIndex,
  legendPosition = 'right',
  onExport,
  onSegmentClick,
  onSegmentHover,
  className = ''
}: AdminPieChartProps) {
  const [visibleSegments, setVisibleSegments] = useState<Record<string, boolean>>(
    data.reduce((acc, item) => ({ ...acc, [item.name]: true }), {})
  )
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Color schemes for healthcare compliance
  const colorSchemes = {
    default: ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'],
    healthcare: ['#0369a1', '#059669', '#dc2626', '#7c2d12', '#581c87', '#0c4a6e', '#166534', '#9a3412'],
    accessible: ['#1f2937', '#374151', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db', '#f3f4f6', '#ffffff']
  }

  // Get segment colors
  const getSegmentColors = useCallback(() => {
    const colors = colorSchemes[colorScheme]
    return data.map((item, index) => item.color || colors[index % colors.length])
  }, [data, colorScheme])

  // Process data for display
  const processedData = useMemo(() => {
    let processed = [...data]

    // Apply HIPAA filtering
    if (hipaaMode) {
      processed = processed.map(item => ({
        ...item,
        value: item.hipaaCompliance === 'phi' ? Math.round(item.value / 10) * 10 : item.value
      }))
    }

    // Filter by minimum value
    if (minValue !== undefined) {
      processed = processed.filter(item => item.value >= minValue)
    }

    // Filter by visibility
    processed = processed.filter(item => visibleSegments[item.name])

    // Sort data
    if (sortBy !== 'none') {
      processed.sort((a, b) => {
        const aVal = sortBy === 'name' ? a.name : a.value
        const bVal = sortBy === 'name' ? b.name : b.value
        
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortDirection === 'asc' 
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal)
        } else {
          return sortDirection === 'asc' 
            ? (aVal as number) - (bVal as number)
            : (bVal as number) - (aVal as number)
        }
      })
    }

    // Limit segments
    if (maxSegments && maxSegments > 0) {
      if (processed.length > maxSegments) {
        const others = processed.slice(maxSegments - 1)
        const othersTotal = others.reduce((sum, item) => sum + item.value, 0)
        processed = [
          ...processed.slice(0, maxSegments - 1),
          { 
            name: `Others (${others.length})`, 
            value: othersTotal, 
            color: '#9ca3af',
            hipaaCompliance: 'public' as const,
            metadata: { isOthersGroup: true, originalItems: others }
          }
        ]
      }
    }

    return processed
  }, [data, hipaaMode, visibleSegments, sortBy, sortDirection, minValue, maxSegments])

  // Calculate total for percentages
  const total = useMemo(() => 
    processedData.reduce((sum, item) => sum + item.value, 0)
  , [processedData])

  // Export handlers
  const handleExport = useCallback((format: 'png' | 'svg' | 'csv') => {
    if (format === 'csv') {
      const csv = [
        'Name,Value,Percentage',
        ...processedData.map(item => 
          `${item.name},${item.value},${((item.value / total) * 100).toFixed(2)}%`
        )
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
  }, [processedData, title, total, onExport])

  // Toggle segment visibility
  const toggleSegment = useCallback((name: string) => {
    if (!allowHide) return
    
    setVisibleSegments(prev => ({
      ...prev,
      [name]: !prev[name]
    }))
  }, [allowHide])

  // Custom label renderer
  const renderLabel = useCallback((entry: PieDataPoint & { percent: number }) => {
    if (!showPercentages && !showValues) return null
    
    const percentage = (entry.percent * 100).toFixed(1)
    
    if (showPercentages && showValues) {
      return `${entry.name}: ${entry.value} (${percentage}%)`
    } else if (showPercentages) {
      return `${percentage}%`
    } else {
      return entry.value.toString()
    }
  }, [showPercentages, showValues])

  // Active shape renderer for highlighting
  const renderActiveShape = useCallback((props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props
    const RADIAN = Math.PI / 180
    const sin = Math.sin(-RADIAN * midAngle)
    const cos = Math.cos(-RADIAN * midAngle)
    const sx = cx + (outerRadius + 10) * cos
    const sy = cy + (outerRadius + 10) * sin
    const mx = cx + (outerRadius + 30) * cos
    const my = cy + (outerRadius + 30) * sin
    const ex = mx + (cos >= 0 ? 1 : -1) * 22
    const ey = my
    const textAnchor = cos >= 0 ? 'start' : 'end'

    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="text-sm font-medium">
          {payload.name}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" className="text-xs">
          {`Value: ${value}`}
        </text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999" className="text-xs">
          {`${(percent * 100).toFixed(2)}%`}
        </text>
      </g>
    )
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

  const segmentColors = getSegmentColors()

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
              {chartType === 'donut' ? 'Donut' : 'Pie'}
            </Badge>
            
            <div className="flex items-center gap-1">
              {chartType === 'donut' ? (
                <Donut className="h-4 w-4 text-gray-500" />
              ) : (
                <PieChartIcon className="h-4 w-4 text-gray-500" />
              )}
              
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2"
                title="Toggle percentages"
              >
                <Percent className="h-3 w-3" />
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

        {/* Summary Stats */}
        <div className="flex items-center gap-4 pt-2 text-sm text-gray-600">
          <span>Total: {total.toLocaleString()}</span>
          <span>Segments: {processedData.length}</span>
          {maxSegments && data.length > maxSegments && (
            <span>({data.length - maxSegments + 1} grouped as "Others")</span>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Chart */}
          <div className="flex-1">
            <div className="w-full" style={{ height: `${height}px`, width: width || '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={processedData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderLabel}
                    outerRadius={`${outerRadius}%`}
                    innerRadius={`${innerRadius}%`}
                    fill="#8884d8"
                    dataKey="value"
                    animationDuration={animate ? 1000 : 0}
                    activeIndex={activeIndex ?? hoveredIndex}
                    activeShape={renderActiveShape}
                    onMouseEnter={(_, index) => {
                      setHoveredIndex(index)
                      onSegmentHover?.(processedData[index], index)
                    }}
                    onMouseLeave={() => {
                      setHoveredIndex(null)
                      onSegmentHover?.(null, null)
                    }}
                    onClick={(data, index) => onSegmentClick?.(data, index)}
                  >
                    {processedData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color || segmentColors[index % segmentColors.length]}
                      />
                    ))}
                  </Pie>
                  
                  <ChartTooltip 
                    hipaaMode={hipaaMode}
                    colorScheme={colorScheme}
                    formatter={(value, name) => [
                      `${value} (${((value / total) * 100).toFixed(1)}%)`,
                      name
                    ]}
                  />
                  
                  {showLegend && (
                    <Legend 
                      verticalAlign={legendPosition === 'top' || legendPosition === 'bottom' ? legendPosition : 'middle'}
                      align={legendPosition === 'left' || legendPosition === 'right' ? legendPosition : 'center'}
                      layout={legendPosition === 'left' || legendPosition === 'right' ? 'vertical' : 'horizontal'}
                    />
                  )}
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Interactive Legend */}
          {allowHide && (
            <div className="space-y-2 min-w-[200px]">
              <h4 className="font-medium text-sm text-gray-700">Segments</h4>
              {data.map((item, index) => {
                const isVisible = visibleSegments[item.name]
                const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'
                const color = item.color || segmentColors[index % segmentColors.length]
                
                return (
                  <div
                    key={item.name}
                    className="flex items-center justify-between p-2 rounded border cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleSegment(item.name)}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: isVisible ? color : '#e5e7eb' }}
                      />
                      <span className={`text-sm ${!isVisible ? 'text-gray-400 line-through' : ''}`}>
                        {item.name}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {item.value} ({percentage}%)
                      </span>
                      <Button variant="ghost" size="sm" className="h-4 p-0">
                        {isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default AdminPieChart