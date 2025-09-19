/**
 * Performance Dashboard Component
 * Real-time performance monitoring and optimization tracking
 */

'use client'

import { useState, useEffect } from 'react'

interface PerformanceMetrics {
  performance: number
  accessibility: number
  bestPractices: number
  seo: number
  fcp: string
  lcp: string
  speedIndex: string
  tbt: string
  cls: string
  tti: string
}

interface PerformanceDashboardProps {
  className?: string
}

export function PerformanceDashboard({ className = '' }: PerformanceDashboardProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [optimizations, setOptimizations] = useState<string[]>([])

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return

    // Load performance metrics
    loadPerformanceMetrics()
    
    // Set up real-time monitoring
    const interval = setInterval(loadPerformanceMetrics, 5000)
    
    return () => clearInterval(interval)
  }, [])

  const loadPerformanceMetrics = () => {
    if (typeof window === 'undefined') return

    // Get Web Vitals from performance API
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const paintEntries = performance.getEntriesByType('paint')
    
    // Calculate basic metrics
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')
    const lcp = performance.getEntriesByType('largest-contentful-paint')[0] as any
    
    // Mock metrics for development (in real app, these would come from Lighthouse API)
    const mockMetrics: PerformanceMetrics = {
      performance: 63,
      accessibility: 92,
      bestPractices: 96,
      seo: 92,
      fcp: fcp ? `${(fcp.startTime / 1000).toFixed(1)}s` : '1.1s',
      lcp: lcp ? `${(lcp.startTime / 1000).toFixed(1)}s` : '3.3s',
      speedIndex: '1.3s',
      tbt: '3,410ms',
      cls: '0',
      tti: '34.2s'
    }
    
    setMetrics(mockMetrics)
    
    // Track optimizations
    const currentOptimizations = [
      'Service Worker Caching',
      'Critical Resource Optimization',
      'Image Optimization Pipeline',
      'Database Query Caching',
      'Aggressive JavaScript Deferral',
      'Micro-chunking Implementation',
      'Progressive Loading',
      'Bundle Size Reduction'
    ]
    
    setOptimizations(currentOptimizations)
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500'
    if (score >= 70) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getMetricColor = (value: string, target: string) => {
    const numValue = parseFloat(value.replace(/[^\d.]/g, ''))
    const numTarget = parseFloat(target.replace(/[^\d.]/g, ''))
    
    if (numValue <= numTarget) return 'text-green-500'
    if (numValue <= numTarget * 1.5) return 'text-yellow-500'
    return 'text-red-500'
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
        title="Show Performance Dashboard"
      >
        📊
      </button>
    )
  }

  return (
    <div className={`fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-y-auto z-50 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Performance Dashboard</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      {metrics && (
        <div className="space-y-4">
          {/* Lighthouse Scores */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Lighthouse Scores</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span>Performance:</span>
                <span className={getScoreColor(metrics.performance)}>
                  {metrics.performance}/100
                </span>
              </div>
              <div className="flex justify-between">
                <span>Accessibility:</span>
                <span className={getScoreColor(metrics.accessibility)}>
                  {metrics.accessibility}/100
                </span>
              </div>
              <div className="flex justify-between">
                <span>Best Practices:</span>
                <span className={getScoreColor(metrics.bestPractices)}>
                  {metrics.bestPractices}/100
                </span>
              </div>
              <div className="flex justify-between">
                <span>SEO:</span>
                <span className={getScoreColor(metrics.seo)}>
                  {metrics.seo}/100
                </span>
              </div>
            </div>
          </div>

          {/* Core Web Vitals */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Core Web Vitals</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>FCP:</span>
                <span className={getMetricColor(metrics.fcp, '1.8s')}>
                  {metrics.fcp} <span className="text-gray-500">(target: &lt;1.8s)</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span>LCP:</span>
                <span className={getMetricColor(metrics.lcp, '2.5s')}>
                  {metrics.lcp} <span className="text-gray-500">(target: &lt;2.5s)</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span>Speed Index:</span>
                <span className={getMetricColor(metrics.speedIndex, '3.4s')}>
                  {metrics.speedIndex} <span className="text-gray-500">(target: &lt;3.4s)</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span>TBT:</span>
                <span className={getMetricColor(metrics.tbt, '200ms')}>
                  {metrics.tbt} <span className="text-gray-500">(target: &lt;200ms)</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span>CLS:</span>
                <span className={getMetricColor(metrics.cls, '0.1')}>
                  {metrics.cls} <span className="text-gray-500">(target: &lt;0.1)</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span>TTI:</span>
                <span className={getMetricColor(metrics.tti, '3.8s')}>
                  {metrics.tti} <span className="text-gray-500">(target: &lt;3.8s)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Active Optimizations */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Active Optimizations</h4>
            <div className="space-y-1">
              {optimizations.map((optimization, index) => (
                <div key={index} className="flex items-center text-xs text-green-600">
                  <span className="mr-2">✅</span>
                  <span>{optimization}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Tips */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Next Steps</h4>
            <div className="space-y-1 text-xs text-gray-600">
              <div>• Fix TBT regression (3,410ms → &lt;200ms)</div>
              <div>• Fix TTI regression (34.2s → &lt;3.8s)</div>
              <div>• Remove unused JavaScript (981 KiB)</div>
              <div>• Optimize LCP (3.3s → &lt;2.5s)</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}