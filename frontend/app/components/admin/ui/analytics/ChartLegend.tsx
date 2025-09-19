'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Eye, 
  EyeOff, 
  Shield, 
  Lock, 
  Unlock,
  Circle,
  Square,
  Triangle,
  Diamond,
  Star,
  Info
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export interface LegendItem {
  /** Data key/identifier */
  dataKey: string
  /** Display name */
  name: string
  /** Color (hex or CSS color) */
  color: string
  /** Whether item is visible */
  visible?: boolean
  /** Legend icon type */
  iconType?: 'circle' | 'square' | 'triangle' | 'diamond' | 'star' | 'line'
  /** HIPAA compliance level */
  hipaaCompliance?: 'public' | 'restricted' | 'phi'
  /** Additional metadata */
  metadata?: Record<string, any>
}

export interface ChartLegendProps {
  /** Legend items */
  payload?: Array<{
    value: string
    color: string
    dataKey?: string
    payload?: any
    type?: string
  }>
  /** Legend layout */
  layout?: 'horizontal' | 'vertical'
  /** Legend alignment */
  align?: 'left' | 'center' | 'right'
  /** Vertical alignment */
  verticalAlign?: 'top' | 'middle' | 'bottom'
  /** Whether items are interactive (clickable) */
  interactive?: boolean
  /** Whether to show HIPAA compliance badges */
  showHipaaLabels?: boolean
  /** HIPAA compliance mode */
  hipaaMode?: boolean
  /** Color scheme */
  colorScheme?: 'default' | 'healthcare' | 'accessible'
  /** Whether items can be hidden/shown */
  allowToggle?: boolean
  /** Icon size */
  iconSize?: 'sm' | 'md' | 'lg'
  /** Legend item spacing */
  spacing?: 'compact' | 'normal' | 'relaxed'
  /** Maximum number of items per row (horizontal layout) */
  maxItemsPerRow?: number
  /** Custom legend content renderer */
  content?: React.ComponentType<any>
  /** Callback when item visibility is toggled */
  onToggleItem?: (dataKey: string, visible: boolean) => void
  /** Callback when item is clicked */
  onItemClick?: (item: LegendItem) => void
  /** Custom CSS classes */
  className?: string
}

/**
 * ChartLegend - Healthcare-compliant legend component for chart visualizations
 * 
 * Features:
 * - Interactive show/hide functionality
 * - HIPAA compliance indicators
 * - Healthcare-specific styling and icons
 * - Flexible layout options (horizontal/vertical)
 * - Accessibility features with ARIA labels
 * - Custom icon types and sizes
 * - Responsive design with wrapping
 * 
 * @example
 * ```tsx
 * // Used within Recharts components
 * <LineChart data={data}>
 *   <ChartLegend 
 *     interactive={true}
 *     showHipaaLabels={true}
 *     allowToggle={true}
 *     colorScheme="healthcare"
 *     onToggleItem={(dataKey, visible) => console.log(`${dataKey} ${visible ? 'shown' : 'hidden'}`)}
 *   />
 * </LineChart>
 * 
 * // Standalone usage
 * <ChartLegend
 *   payload={[
 *     { value: 'Patient Visits', color: '#0ea5e9', dataKey: 'visits' },
 *     { value: 'Satisfaction Score', color: '#10b981', dataKey: 'satisfaction' },
 *   ]}
 *   layout="horizontal"
 *   interactive={true}
 * />
 * ```
 */
export function ChartLegend({
  payload = [],
  layout = 'horizontal',
  align = 'center',
  verticalAlign = 'bottom',
  interactive = true,
  showHipaaLabels = true,
  hipaaMode = false,
  colorScheme = 'healthcare',
  allowToggle = false,
  iconSize = 'md',
  spacing = 'normal',
  maxItemsPerRow = 4,
  content: CustomContent,
  onToggleItem,
  onItemClick,
  className = ''
}: ChartLegendProps) {
  const [itemVisibility, setItemVisibility] = useState<Record<string, boolean>>(
    payload.reduce((acc, item) => ({
      ...acc,
      [item.dataKey || item.value]: true
    }), {})
  )

  // Color scheme configurations
  const colorSchemes = {
    default: {
      text: 'text-gray-900',
      subtext: 'text-gray-500',
      hover: 'hover:bg-gray-50',
      border: 'border-gray-200'
    },
    healthcare: {
      text: 'text-gray-900',
      subtext: 'text-blue-600',
      hover: 'hover:bg-blue-50',
      border: 'border-blue-200'
    },
    accessible: {
      text: 'text-gray-900',
      subtext: 'text-gray-700',
      hover: 'hover:bg-gray-100',
      border: 'border-gray-300'
    }
  }

  // Icon size configurations
  const iconSizes = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  }

  // Spacing configurations
  const spacingClasses = {
    compact: layout === 'horizontal' ? 'gap-2' : 'gap-1',
    normal: layout === 'horizontal' ? 'gap-4' : 'gap-2',
    relaxed: layout === 'horizontal' ? 'gap-6' : 'gap-3'
  }

  // Get icon component for legend item
  const getIconComponent = useCallback((iconType: string = 'circle') => {
    const iconMap = {
      circle: Circle,
      square: Square,
      triangle: Triangle,
      diamond: Diamond,
      star: Star,
      line: ({ className, style }: { className?: string, style?: React.CSSProperties }) => (
        <div 
          className={`${className} border-t-2`} 
          style={{ ...style, width: '12px', height: '1px', borderColor: style?.color }}
        />
      )
    }
    return iconMap[iconType as keyof typeof iconMap] || Circle
  }, [])

  // Handle item toggle
  const handleToggleItem = useCallback((dataKey: string) => {
    if (!allowToggle) return

    const newVisibility = !itemVisibility[dataKey]
    setItemVisibility(prev => ({
      ...prev,
      [dataKey]: newVisibility
    }))
    onToggleItem?.(dataKey, newVisibility)
  }, [allowToggle, itemVisibility, onToggleItem])

  // Handle item click
  const handleItemClick = useCallback((item: any) => {
    const legendItem: LegendItem = {
      dataKey: item.dataKey || item.value,
      name: item.value,
      color: item.color,
      visible: itemVisibility[item.dataKey || item.value],
      hipaaCompliance: item.payload?.hipaaCompliance || 'public',
      metadata: item.payload?.metadata
    }
    onItemClick?.(legendItem)
  }, [itemVisibility, onItemClick])

  // Use custom content if provided
  if (CustomContent) {
    return <CustomContent payload={payload} />
  }

  if (!payload.length) {
    return null
  }

  const scheme = colorSchemes[colorScheme]

  // Container classes based on layout and alignment
  const containerClasses = [
    layout === 'horizontal' ? 'flex flex-wrap' : 'flex flex-col',
    layout === 'horizontal' && align === 'left' ? 'justify-start' : '',
    layout === 'horizontal' && align === 'center' ? 'justify-center' : '',
    layout === 'horizontal' && align === 'right' ? 'justify-end' : '',
    spacingClasses[spacing],
    className
  ].filter(Boolean).join(' ')

  return (
    <TooltipProvider>
      <div className={containerClasses}>
        {payload.map((item, index) => {
          const dataKey = item.dataKey || item.value
          const isVisible = itemVisibility[dataKey]
          const hipaaCompliance = item.payload?.hipaaCompliance || 'public'
          const IconComponent = getIconComponent(item.payload?.iconType)
          
          // Process for HIPAA if needed
          let displayName = item.value
          if (hipaaMode && hipaaCompliance === 'phi') {
            displayName = `${item.value} *`
          }

          return (
            <div
              key={`legend-${index}`}
              className={`
                flex items-center gap-2 px-2 py-1 rounded transition-all duration-200
                ${interactive ? `cursor-pointer ${scheme.hover}` : ''}
                ${!isVisible ? 'opacity-50' : ''}
                ${allowToggle ? 'select-none' : ''}
              `}
              onClick={() => interactive && handleItemClick(item)}
            >
              {/* Legend Icon */}
              <div className="relative">
                {item.type === 'line' || item.payload?.iconType === 'line' ? (
                  <div 
                    className={`${iconSizes[iconSize]} border-t-2`}
                    style={{ borderColor: isVisible ? item.color : '#d1d5db', width: '12px' }}
                  />
                ) : (
                  <IconComponent 
                    className={iconSizes[iconSize]}
                    style={{ color: isVisible ? item.color : '#d1d5db' }}
                    fill={isVisible ? item.color : '#d1d5db'}
                  />
                )}
              </div>

              {/* Legend Text */}
              <span 
                className={`text-sm font-medium ${scheme.text} ${!isVisible ? 'line-through' : ''}`}
              >
                {displayName}
              </span>

              {/* HIPAA Compliance Badges */}
              {showHipaaLabels && hipaaMode && (
                <div className="flex items-center gap-1">
                  {hipaaCompliance === 'phi' && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="secondary" className="text-xs px-1 py-0">
                          <Shield className="h-2 w-2 mr-1" />
                          PHI
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <span>Protected Health Information</span>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {hipaaCompliance === 'restricted' && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          <Lock className="h-2 w-2 mr-1" />
                          Restricted
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <span>Restricted Access Data</span>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {hipaaCompliance === 'public' && showHipaaLabels && (
                    <Unlock className="h-3 w-3 text-green-500" title="Public Data" />
                  )}
                </div>
              )}

              {/* Toggle Visibility Button */}
              {allowToggle && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToggleItem(dataKey)
                  }}
                  aria-label={`${isVisible ? 'Hide' : 'Show'} ${item.value}`}
                >
                  {isVisible ? (
                    <Eye className="h-3 w-3" />
                  ) : (
                    <EyeOff className="h-3 w-3" />
                  )}
                </Button>
              )}

              {/* Metadata Info */}
              {item.payload?.metadata && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-sm space-y-1">
                      {Object.entries(item.payload.metadata).map(([key, value]) => (
                        <div key={key} className="flex justify-between gap-2">
                          <span className="font-medium">{key}:</span>
                          <span>{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Line break for horizontal layout with max items per row */}
              {layout === 'horizontal' && maxItemsPerRow && 
               (index + 1) % maxItemsPerRow === 0 && 
               index < payload.length - 1 && (
                <div className="w-full" />
              )}
            </div>
          )
        })}

        {/* HIPAA Mode Footer */}
        {hipaaMode && payload.some(item => item.payload?.hipaaCompliance === 'phi') && (
          <div className={`
            ${layout === 'horizontal' ? 'w-full mt-2' : 'mt-3'} 
            pt-2 border-t ${scheme.border}
          `}>
            <div className="flex items-center gap-1 text-xs text-amber-600">
              <Shield className="h-3 w-3" />
              <span>* PHI data anonymized for compliance</span>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

/**
 * Healthcare-specific legend presets for common medical visualizations
 */
export const HealthcareLegendPresets = {
  /** Legend for patient demographic data */
  PatientDemographics: (props: Partial<ChartLegendProps>) => (
    <ChartLegend
      colorScheme="healthcare"
      showHipaaLabels={true}
      allowToggle={true}
      iconSize="md"
      {...props}
    />
  ),

  /** Legend for department performance metrics */
  DepartmentMetrics: (props: Partial<ChartLegendProps>) => (
    <ChartLegend
      layout="vertical"
      align="left"
      colorScheme="healthcare"
      interactive={true}
      spacing="normal"
      {...props}
    />
  ),

  /** Legend for financial/revenue data */
  FinancialData: (props: Partial<ChartLegendProps>) => (
    <ChartLegend
      colorScheme="default"
      layout="horizontal"
      align="center"
      showHipaaLabels={false}
      {...props}
    />
  ),

  /** Legend for clinical outcomes */
  ClinicalOutcomes: (props: Partial<ChartLegendProps>) => (
    <ChartLegend
      colorScheme="healthcare"
      showHipaaLabels={true}
      allowToggle={true}
      spacing="relaxed"
      hipaaMode={true}
      {...props}
    />
  )
}

export default ChartLegend