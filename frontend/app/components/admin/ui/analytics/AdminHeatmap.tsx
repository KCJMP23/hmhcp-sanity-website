'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Grid3X3,
  Palette,
  Thermometer,
  Eye,
  EyeOff,
  Info
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export interface HeatmapDataPoint {
  /** Row identifier */
  row: string | number
  /** Column identifier */
  column: string | number
  /** Value for the heatmap cell */
  value: number
  /** Optional metadata */
  metadata?: Record<string, any>
  /** HIPAA compliance level for healthcare data */
  hipaaCompliance?: 'public' | 'restricted' | 'phi'
}

export interface AdminHeatmapProps {
  /** Heatmap data array */
  data: HeatmapDataPoint[]
  /** Chart title */
  title: string
  /** Chart description */
  description?: string
  /** Height of the chart container */
  height?: number
  /** Width of the chart container */
  width?: number
  /** Row labels array (optional, will be inferred from data if not provided) */
  rowLabels?: string[]
  /** Column labels array (optional, will be inferred from data if not provided) */
  columnLabels?: string[]
  /** Cell size in pixels */
  cellSize?: number
  /** Gap between cells in pixels */
  cellGap?: number
  /** Color scheme */
  colorScheme?: 'default' | 'healthcare' | 'accessible' | 'temperature' | 'custom'
  /** Custom color range [min, max] */
  customColors?: [string, string]
  /** Whether to show cell values */
  showValues?: boolean
  /** Whether to show row labels */
  showRowLabels?: boolean
  /** Whether to show column labels */
  showColumnLabels?: boolean
  /** Whether to show legend */
  showLegend?: boolean
  /** Whether to show export controls */
  showExport?: boolean
  /** HIPAA compliance mode */
  hipaaMode?: boolean
  /** Loading state */
  loading?: boolean
  /** Error state */
  error?: string
  /** Value format function */
  valueFormat?: (value: number) => string
  /** Minimum value override */
  minValue?: number
  /** Maximum value override */
  maxValue?: number
  /** Cell border radius */
  borderRadius?: number
  /** Whether cells are interactive */
  interactive?: boolean
  /** Callback when exporting data */
  onExport?: (format: 'png' | 'svg' | 'csv') => void
  /** Callback when cell is clicked */
  onCellClick?: (data: HeatmapDataPoint) => void
  /** Callback when cell is hovered */
  onCellHover?: (data: HeatmapDataPoint | null) => void
  /** Custom CSS classes */
  className?: string
}

/**
 * AdminHeatmap - Healthcare-compliant heatmap component for admin analytics
 * 
 * Features:
 * - Customizable color schemes for healthcare data visualization
 * - Interactive cells with tooltips
 * - Export functionality (PNG, SVG, CSV)
 * - HIPAA compliance mode for PHI data
 * - Responsive design with accessibility features
 * - Zoom controls for detailed analysis
 * - Multiple color schemes and customization options
 * 
 * @example
 * ```tsx
 * const data = [
 *   { row: 'Monday', column: '9 AM', value: 23, hipaaCompliance: 'restricted' },
 *   { row: 'Monday', column: '10 AM', value: 45, hipaaCompliance: 'phi' },
 *   { row: 'Tuesday', column: '9 AM', value: 12, hipaaCompliance: 'public' },
 * ]
 * 
 * <AdminHeatmap 
 *   data={data} 
 *   title="Appointment Density by Time"
 *   colorScheme="healthcare"
 *   showValues={true}
 *   hipaaMode={true}
 *   interactive={true}
 * />
 * ```
 */
export function AdminHeatmap({
  data,
  title,
  description,
  height = 400,
  width,
  rowLabels,
  columnLabels,
  cellSize = 40,
  cellGap = 2,
  colorScheme = 'healthcare',
  customColors,
  showValues = true,
  showRowLabels = true,
  showColumnLabels = true,
  showLegend = true,
  showExport = true,
  hipaaMode = false,
  loading = false,
  error,
  valueFormat = (value) => value.toString(),
  minValue,
  maxValue,
  borderRadius = 4,
  interactive = true,
  onExport,
  onCellClick,
  onCellHover,
  className = ''
}: AdminHeatmapProps) {
  const [zoomLevel, setZoomLevel] = useState(100)
  const [hoveredCell, setHoveredCell] = useState<HeatmapDataPoint | null>(null)

  // Color schemes for heatmaps
  const colorSchemes = {
    default: ['#f0f9ff', '#0ea5e9'],
    healthcare: ['#f0f9ff', '#0369a1'],
    accessible: ['#f9fafb', '#1f2937'],
    temperature: ['#dbeafe', '#ef4444'],
    custom: customColors || ['#f0f9ff', '#0ea5e9']
  }

  // Process data for HIPAA compliance
  const processedData = useMemo(() => {
    let processed = [...data]
    
    if (hipaaMode) {
      processed = processed.map(point => ({
        ...point,
        value: point.hipaaCompliance === 'phi' ? Math.round(point.value / 10) * 10 : point.value
      }))
    }
    
    return processed
  }, [data, hipaaMode])

  // Get unique rows and columns
  const { rows, columns } = useMemo(() => {
    const uniqueRows = rowLabels || Array.from(new Set(processedData.map(d => d.row.toString()))).sort()
    const uniqueColumns = columnLabels || Array.from(new Set(processedData.map(d => d.column.toString()))).sort()
    
    return { rows: uniqueRows, columns: uniqueColumns }
  }, [processedData, rowLabels, columnLabels])

  // Calculate value range
  const { min, max } = useMemo(() => {
    const values = processedData.map(d => d.value)
    return {
      min: minValue ?? Math.min(...values),
      max: maxValue ?? Math.max(...values)
    }
  }, [processedData, minValue, maxValue])

  // Create data grid
  const dataGrid = useMemo(() => {
    const grid: { [key: string]: HeatmapDataPoint | undefined } = {}
    
    processedData.forEach(point => {
      const key = `${point.row}-${point.column}`
      grid[key] = point
    })
    
    return grid
  }, [processedData])

  // Get color for value
  const getColorForValue = useCallback((value: number) => {
    const [minColor, maxColor] = colorSchemes[colorScheme]
    const ratio = max > min ? (value - min) / (max - min) : 0
    
    // Simple linear interpolation between colors
    const minRgb = hexToRgb(minColor)
    const maxRgb = hexToRgb(maxColor)
    
    if (!minRgb || !maxRgb) return minColor
    
    const r = Math.round(minRgb.r + (maxRgb.r - minRgb.r) * ratio)
    const g = Math.round(minRgb.g + (maxRgb.g - minRgb.g) * ratio)
    const b = Math.round(minRgb.b + (maxRgb.b - minRgb.b) * ratio)
    
    return `rgb(${r}, ${g}, ${b})`
  }, [colorScheme, min, max])

  // Helper function to convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }

  // Export handlers
  const handleExport = useCallback((format: 'png' | 'svg' | 'csv') => {
    if (format === 'csv') {
      const headers = ['Row', 'Column', 'Value']
      const csvData = [
        headers.join(','),
        ...processedData.map(point => 
          `${point.row},${point.column},${point.value}`
        )
      ].join('\n')
      
      const blob = new Blob([csvData], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title.replace(/\s+/g, '_').toLowerCase()}_heatmap.csv`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      onExport?.(format)
    }
  }, [processedData, title, onExport])

  // Handle cell interactions
  const handleCellClick = useCallback((cellData: HeatmapDataPoint | undefined) => {
    if (!interactive || !cellData) return
    onCellClick?.(cellData)
  }, [interactive, onCellClick])

  const handleCellHover = useCallback((cellData: HeatmapDataPoint | null) => {
    if (!interactive) return
    setHoveredCell(cellData)
    onCellHover?.(cellData)
  }, [interactive, onCellHover])

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

  const totalWidth = columns.length * (cellSize + cellGap) + (showRowLabels ? 100 : 0)
  const totalHeight = rows.length * (cellSize + cellGap) + (showColumnLabels ? 40 : 0)

  return (
    <TooltipProvider>
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
                {rows.length} × {columns.length}
              </Badge>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2"
                  title="Heatmap view"
                >
                  <Grid3X3 className="h-3 w-3" />
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
                  onClick={() => setZoomLevel(Math.max(50, zoomLevel - 25))}
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

          {/* Statistics */}
          <div className="flex items-center gap-4 pt-2 text-sm text-gray-600">
            <span>Range: {valueFormat(min)} - {valueFormat(max)}</span>
            <span>Cells: {processedData.length}</span>
            {hoveredCell && (
              <span className="font-medium">
                Hovered: {hoveredCell.row} × {hoveredCell.column} = {valueFormat(hoveredCell.value)}
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex gap-6">
            {/* Heatmap */}
            <div 
              className="overflow-auto" 
              style={{ 
                height: `${height}px`,
                width: width || 'auto',
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top left'
              }}
            >
              <div className="relative">
                {/* Column Labels */}
                {showColumnLabels && (
                  <div 
                    className="flex" 
                    style={{ 
                      marginLeft: showRowLabels ? '100px' : '0',
                      marginBottom: `${cellGap}px`
                    }}
                  >
                    {columns.map((col, colIndex) => (
                      <div
                        key={col}
                        className="text-xs text-gray-600 font-medium flex items-end justify-center"
                        style={{ 
                          width: `${cellSize}px`,
                          height: '30px',
                          marginRight: colIndex < columns.length - 1 ? `${cellGap}px` : '0'
                        }}
                      >
                        <span className="transform -rotate-45 whitespace-nowrap">{col}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Heatmap Grid */}
                {rows.map((row, rowIndex) => (
                  <div key={row} className="flex" style={{ marginBottom: `${cellGap}px` }}>
                    {/* Row Label */}
                    {showRowLabels && (
                      <div
                        className="text-xs text-gray-600 font-medium flex items-center justify-end pr-2"
                        style={{ 
                          width: '100px',
                          height: `${cellSize}px`,
                          marginRight: `${cellGap}px`
                        }}
                      >
                        {row}
                      </div>
                    )}

                    {/* Row Cells */}
                    {columns.map((col, colIndex) => {
                      const cellData = dataGrid[`${row}-${col}`]
                      const cellColor = cellData ? getColorForValue(cellData.value) : '#f9fafb'
                      const isHovered = hoveredCell === cellData
                      
                      return (
                        <Tooltip key={`${row}-${col}`}>
                          <TooltipTrigger asChild>
                            <div
                              className={`
                                flex items-center justify-center text-xs font-medium cursor-pointer
                                transition-all duration-200 border border-gray-200
                                ${interactive ? 'hover:shadow-md hover:scale-105' : ''}
                                ${isHovered ? 'ring-2 ring-blue-500' : ''}
                              `}
                              style={{
                                width: `${cellSize}px`,
                                height: `${cellSize}px`,
                                backgroundColor: cellColor,
                                borderRadius: `${borderRadius}px`,
                                marginRight: colIndex < columns.length - 1 ? `${cellGap}px` : '0',
                                color: cellData && cellData.value > (min + max) / 2 ? '#ffffff' : '#1f2937'
                              }}
                              onClick={() => handleCellClick(cellData)}
                              onMouseEnter={() => handleCellHover(cellData)}
                              onMouseLeave={() => handleCellHover(null)}
                            >
                              {showValues && cellData && valueFormat(cellData.value)}
                            </div>
                          </TooltipTrigger>
                          {cellData && (
                            <TooltipContent>
                              <div className="text-sm">
                                <div className="font-semibold">{row} × {col}</div>
                                <div>Value: {valueFormat(cellData.value)}</div>
                                {cellData.metadata && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {Object.entries(cellData.metadata).map(([key, value]) => (
                                      <div key={key}>{key}: {value}</div>
                                    ))}
                                  </div>
                                )}
                                {hipaaMode && cellData.hipaaCompliance === 'phi' && (
                                  <div className="text-xs text-amber-600 mt-1">
                                    * Anonymized for HIPAA compliance
                                  </div>
                                )}
                              </div>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            {showLegend && (
              <div className="flex flex-col gap-4 min-w-[120px]">
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Scale</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: getColorForValue(max) }}
                      />
                      <span>{valueFormat(max)} (max)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: getColorForValue((min + max) / 2) }}
                      />
                      <span>{valueFormat((min + max) / 2)} (avg)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: getColorForValue(min) }}
                      />
                      <span>{valueFormat(min)} (min)</span>
                    </div>
                  </div>
                </div>

                {/* Color Scheme Info */}
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Theme</h4>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Palette className="h-3 w-3" />
                    <span className="capitalize">{colorScheme}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}

export default AdminHeatmap