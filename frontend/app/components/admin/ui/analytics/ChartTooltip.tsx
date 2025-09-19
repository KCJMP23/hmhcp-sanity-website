'use client'

import React, { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Shield, Eye, AlertTriangle } from 'lucide-react'

export interface ChartTooltipProps {
  /** Whether tooltip is active/visible */
  active?: boolean
  /** Payload data from chart */
  payload?: Array<{
    value: number | string
    name: string
    color: string
    dataKey: string
    payload?: any
  }>
  /** Label for the data point (typically x-axis value) */
  label?: string
  /** HIPAA compliance mode */
  hipaaMode?: boolean
  /** Color scheme for styling */
  colorScheme?: 'default' | 'healthcare' | 'accessible'
  /** Custom formatter for values */
  formatter?: (value: any, name: string, props: any) => [React.ReactNode, string] | React.ReactNode
  /** Custom label formatter */
  labelFormatter?: (label: string) => React.ReactNode
  /** Custom separator between items */
  separator?: string
  /** Whether to show indicators (colored squares) */
  showIndicators?: boolean
  /** Whether to show HIPAA compliance badges */
  showHipaaLabels?: boolean
  /** Custom content renderer */
  content?: React.ComponentType<any>
  /** Animation duration in ms */
  animationDuration?: number
  /** Custom CSS classes */
  className?: string
}

/**
 * ChartTooltip - Healthcare-compliant tooltip component for chart visualizations
 * 
 * Features:
 * - HIPAA compliance indicators and warnings
 * - Healthcare-specific color schemes and formatting
 * - Customizable value formatters
 * - Animated appearance with smooth transitions
 * - Accessibility-compliant design
 * - Support for complex data structures
 * 
 * @example
 * ```tsx
 * // Used within Recharts components
 * <LineChart data={data}>
 *   <ChartTooltip 
 *     hipaaMode={true}
 *     colorScheme="healthcare"
 *     formatter={(value, name) => [`${value} patients`, name]}
 *     showHipaaLabels={true}
 *   />
 * </LineChart>
 * ```
 */
export function ChartTooltip({
  active = false,
  payload = [],
  label,
  hipaaMode = false,
  colorScheme = 'healthcare',
  formatter,
  labelFormatter,
  separator = ' : ',
  showIndicators = true,
  showHipaaLabels = true,
  content: CustomContent,
  animationDuration = 200,
  className = ''
}: ChartTooltipProps) {
  
  // Color scheme configurations
  const colorSchemes = {
    default: {
      background: 'bg-white',
      border: 'border-gray-200',
      text: 'text-gray-900',
      subtext: 'text-gray-500',
      shadow: 'shadow-lg'
    },
    healthcare: {
      background: 'bg-white',
      border: 'border-blue-200',
      text: 'text-gray-900',
      subtext: 'text-blue-600',
      shadow: 'shadow-xl'
    },
    accessible: {
      background: 'bg-gray-900',
      border: 'border-gray-600',
      text: 'text-white',
      subtext: 'text-gray-300',
      shadow: 'shadow-xl'
    }
  }

  // Process payload for HIPAA compliance
  const processedPayload = useMemo(() => {
    return payload.map(item => {
      let processedValue = item.value
      let isAnonymized = false

      // Check if data needs HIPAA anonymization
      if (hipaaMode && item.payload) {
        const hipaaCompliance = item.payload.hipaaCompliance || 'public'
        if (hipaaCompliance === 'phi' && typeof processedValue === 'number') {
          processedValue = Math.round(processedValue / 10) * 10
          isAnonymized = true
        }
      }

      return {
        ...item,
        value: processedValue,
        isAnonymized,
        hipaaCompliance: item.payload?.hipaaCompliance || 'public'
      }
    })
  }, [payload, hipaaMode])

  // Format label
  const formattedLabel = useMemo(() => {
    if (!label) return null
    return labelFormatter ? labelFormatter(label) : label
  }, [label, labelFormatter])

  // Don't render if not active or no data
  if (!active || !payload.length) {
    return null
  }

  // Use custom content if provided
  if (CustomContent) {
    return <CustomContent active={active} payload={processedPayload} label={formattedLabel} />
  }

  const scheme = colorSchemes[colorScheme]

  return (
    <div 
      className={`
        ${scheme.background} ${scheme.border} ${scheme.shadow}
        border rounded-lg p-3 min-w-[200px] max-w-[350px]
        transition-all duration-${animationDuration} opacity-95
        ${className}
      `}
      style={{
        animation: `fadeIn ${animationDuration}ms ease-in-out`
      }}
    >
      {/* Label/Header */}
      {formattedLabel && (
        <div className={`font-semibold mb-2 pb-2 border-b ${scheme.border} ${scheme.text}`}>
          {formattedLabel}
        </div>
      )}

      {/* Data Items */}
      <div className="space-y-2">
        {processedPayload.map((item, index) => {
          // Format the value using custom formatter or default
          let formattedValue: React.ReactNode
          let displayName: string

          if (formatter) {
            const result = formatter(item.value, item.name, item)
            if (Array.isArray(result)) {
              [formattedValue, displayName] = result
            } else {
              formattedValue = result
              displayName = item.name
            }
          } else {
            formattedValue = item.value
            displayName = item.name
          }

          return (
            <div key={`tooltip-item-${index}`} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                {/* Color Indicator */}
                {showIndicators && (
                  <div
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                )}
                
                {/* Name */}
                <span className={`text-sm font-medium ${scheme.text} truncate`}>
                  {displayName}
                </span>

                {/* HIPAA Compliance Badge */}
                {showHipaaLabels && hipaaMode && (
                  <div className="flex items-center gap-1">
                    {item.hipaaCompliance === 'phi' && (
                      <Badge variant="secondary" className="text-xs px-1 py-0">
                        <Shield className="h-2 w-2 mr-1" />
                        PHI
                      </Badge>
                    )}
                    {item.hipaaCompliance === 'restricted' && (
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        <Eye className="h-2 w-2 mr-1" />
                        Restricted
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Separator and Value */}
              <div className="flex items-center gap-1">
                <span className={`text-sm ${scheme.subtext}`}>{separator}</span>
                <span className={`text-sm font-semibold ${scheme.text} text-right`}>
                  {formattedValue}
                </span>
                
                {/* Anonymization Warning */}
                {item.isAnonymized && (
                  <AlertTriangle className="h-3 w-3 text-amber-500 ml-1" title="Value anonymized for HIPAA compliance" />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* HIPAA Mode Footer */}
      {hipaaMode && processedPayload.some(item => item.isAnonymized) && (
        <div className={`mt-3 pt-2 border-t ${scheme.border}`}>
          <div className="flex items-center gap-1 text-xs text-amber-600">
            <Shield className="h-3 w-3" />
            <span>* Values rounded for HIPAA compliance</span>
          </div>
        </div>
      )}

      {/* Metadata Display */}
      {payload[0]?.payload?.metadata && (
        <div className={`mt-3 pt-2 border-t ${scheme.border}`}>
          <div className="text-xs space-y-1">
            {Object.entries(payload[0].payload.metadata).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className={scheme.subtext}>{key}:</span>
                <span className={scheme.text}>{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Healthcare-specific tooltip presets for common medical data
 */
export const HealthcareTooltipPresets = {
  /** Tooltip for patient count data */
  PatientCount: (props: Partial<ChartTooltipProps>) => (
    <ChartTooltip
      formatter={(value, name) => [
        `${Number(value).toLocaleString()} patients`,
        name
      ]}
      colorScheme="healthcare"
      showHipaaLabels={true}
      {...props}
    />
  ),

  /** Tooltip for financial/revenue data */
  Revenue: (props: Partial<ChartTooltipProps>) => (
    <ChartTooltip
      formatter={(value, name) => [
        `$${Number(value).toLocaleString()}`,
        name
      ]}
      colorScheme="default"
      {...props}
    />
  ),

  /** Tooltip for percentage/rate data */
  Percentage: (props: Partial<ChartTooltipProps>) => (
    <ChartTooltip
      formatter={(value, name) => [
        `${Number(value).toFixed(2)}%`,
        name
      ]}
      colorScheme="healthcare"
      {...props}
    />
  ),

  /** Tooltip for time-based data */
  Duration: (props: Partial<ChartTooltipProps>) => (
    <ChartTooltip
      formatter={(value, name) => {
        const minutes = Number(value)
        const hours = Math.floor(minutes / 60)
        const remainingMinutes = minutes % 60
        
        if (hours > 0) {
          return [`${hours}h ${remainingMinutes}m`, name]
        }
        return [`${minutes}m`, name]
      }}
      colorScheme="healthcare"
      {...props}
    />
  ),

  /** Tooltip for satisfaction scores */
  Satisfaction: (props: Partial<ChartTooltipProps>) => (
    <ChartTooltip
      formatter={(value, name) => [
        `${Number(value).toFixed(1)}/5.0`,
        name
      ]}
      colorScheme="healthcare"
      showHipaaLabels={true}
      {...props}
    />
  )
}

// CSS keyframes for fade-in animation
const fadeInStyle = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.getElementById('chart-tooltip-styles')) {
  const style = document.createElement('style')
  style.id = 'chart-tooltip-styles'
  style.textContent = fadeInStyle
  document.head.appendChild(style)
}

export default ChartTooltip