"use client"

import React from "react"
import { ThreeDComponentBoundary } from "@/components/error-boundaries"
import dynamic from 'next/dynamic'

// Dynamically import the 3D component with no SSR
const Platform3DModel = dynamic<{selectedPlatform?: string, onSelect?: (platform: string) => void}>(
  () => import('./platform-3d-model').catch(err => {
    console.error('Failed to load 3D model:', err)
    // Return a fallback component
    const FallbackComponent = () => <div>3D Model unavailable</div>
    return { default: FallbackComponent } as any
  }),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading 3D Model...</p>
        </div>
      </div>
    )
  }
)

// Fallback component for when WebGL is not supported
const WebGLFallback = () => (
  <div className="w-full h-[400px] bg-gradient-to-br from-blue-50 to-blue-50 dark:from-blue-900/20 dark:to-blue-900/20 flex items-center justify-center border border-blue-200 dark:border-blue-800">
    <div className="text-center p-6">
      <div className="mb-4">
        <svg className="h-16 w-16 text-blue-600 dark:text-blue-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Platform Showcase
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Interactive 3D model is not available in your current browser.
      </p>
      <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
        {['IntelliC', 'Precognitive Health', 'Wear API', 'Data Engine'].map((platform) => (
          <div key={platform} className="bg-white dark:bg-gray-800 p-3 border text-center">
            <div className="text-xs font-medium text-gray-900 dark:text-gray-100">{platform}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
)

interface SafePlatform3DModelProps {
  selectedPlatform?: string
  onSelect?: (platform: string) => void
  className?: string
}

/**
 * Safe wrapper for the 3D platform model with comprehensive error handling
 */
export function SafePlatform3DModel({ 
  selectedPlatform, 
  onSelect,
  className = ""
}: SafePlatform3DModelProps) {
  return (
    <ThreeDComponentBoundary
      componentName="Platform 3D Model"
      loadingMessage="Loading interactive 3D platform model..."
      fallbackComponent={<WebGLFallback />}
      enableRetry={true}
      enableToggle={true}
    >
      <div className={className}>
        <Platform3DModel 
          selectedPlatform={selectedPlatform}
          onSelect={onSelect}
        />
      </div>
    </ThreeDComponentBoundary>
  )
}

export default SafePlatform3DModel