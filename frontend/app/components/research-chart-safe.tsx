"use client"

import React from "react"
import { ChartComponentBoundary } from "@/components/error-boundaries"
import { ChartLoadingFallback } from "@/components/loading/fallbacks"
import dynamic from 'next/dynamic'

// Dynamically import the chart component
const ResearchChart = dynamic(
  () => import('./research-chart').then(mod => ({ default: mod.ResearchChart })).catch(err => {
    console.error('Failed to load chart component:', err)
    // Return a simple fallback
    return { 
      default: ({ title }: { title?: string }) => (
        <div className="w-full h-64 bg-gray-50 dark:bg-gray-800 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">
              {title ? `${title} chart` : 'Chart'} is currently unavailable
            </p>
          </div>
        </div>
      )
    }
  }),
  { 
    ssr: false,
    loading: () => <ChartLoadingFallback />
  }
)

interface SafeResearchChartProps {
  data: any[]
  type?: "line" | "area"
  colors?: {
    primary: string
    secondary?: string
  }
  animated?: boolean
  height?: number
  title?: string
  description?: string
  className?: string
}

// Static fallback component for chart errors
const ChartFallback = ({ title, description, data }: { title?: string; description?: string; data?: any[] }) => (
  <div className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6">
    <div className="text-center">
      <div className="mb-4">
        <svg className="h-12 w-12 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {title}
        </h3>
      )}
      
      {description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {description}
        </p>
      )}
      
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Chart visualization is temporarily unavailable.
      </p>
      
      {/* Show basic data summary if available */}
      {data && data.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 text-left text-xs">
          <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">Data Summary:</p>
          <p className="text-gray-600 dark:text-gray-400">
            {data.length} data points available
          </p>
          {data[0] && Object.keys(data[0]).length > 0 && (
            <p className="text-gray-600 dark:text-gray-400">
              Fields: {Object.keys(data[0]).join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  </div>
)

/**
 * Safe wrapper for the research chart component with comprehensive error handling
 */
export function SafeResearchChart(props: SafeResearchChartProps) {
  const { className = "", ...chartProps } = props
  
  return (
    <ChartComponentBoundary
      componentName={`Research Chart${props.title ? ` - ${props.title}` : ''}`}
      loadingMessage={`Loading ${props.title ? props.title.toLowerCase() : 'research'} chart...`}
      fallbackComponent={
        <ChartFallback 
          title={props.title} 
          description={props.description}
          data={props.data}
        />
      }
      enableRetry={true}
      enableToggle={false}
    >
      <div className={className}>
        <ResearchChart {...chartProps} />
      </div>
    </ChartComponentBoundary>
  )
}

export default SafeResearchChart