'use client'

import { useState, useEffect } from 'react'
import { getWebVitalsMonitor, WebVitalMetric } from '@/lib/performance/web-vitals'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Activity, AlertCircle, CheckCircle, Clock, Zap, TrendingUp } from 'lucide-react'

interface PerformanceData {
  timestamp: number
  lcp?: number
  fid?: number
  cls?: number
  fcp?: number
  ttfb?: number
  inp?: number
}

export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<Record<string, WebVitalMetric>>({})
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceData[]>([])
  const [performanceScore, setPerformanceScore] = useState<number>(0)

  useEffect(() => {
    const monitor = getWebVitalsMonitor()

    // Subscribe to web vitals updates
    monitor.onMetric((metric) => {
      setMetrics(prev => ({
        ...prev,
        [metric.name]: metric,
      }))

      // Update performance history
      setPerformanceHistory(prev => {
        const newData: PerformanceData = {
          timestamp: Date.now(),
          [metric.name.toLowerCase()]: metric.value,
        }

        // Keep last 20 data points
        return [...prev.slice(-19), newData]
      })
    })

    // Calculate initial performance score
    calculatePerformanceScore()

    return () => {
      monitor.disconnect()
    }
  }, [])

  useEffect(() => {
    calculatePerformanceScore()
  }, [metrics])

  const calculatePerformanceScore = () => {
    let score = 100
    const weights = {
      LCP: 25,
      FID: 25,
      CLS: 25,
      FCP: 15,
      TTFB: 10,
    }

    Object.entries(metrics).forEach(([name, metric]) => {
      if (metric.rating === 'needs-improvement') {
        score -= weights[name as keyof typeof weights] * 0.5 || 0
      } else if (metric.rating === 'poor') {
        score -= weights[name as keyof typeof weights] || 0
      }
    })

    setPerformanceScore(Math.max(0, Math.round(score)))
  }

  const getMetricInfo = (name: string) => {
    const info: Record<string, { description: string; target: string }> = {
      LCP: {
        description: 'Largest Contentful Paint - Loading performance',
        target: '< 2.5s',
      },
      FID: {
        description: 'First Input Delay - Interactivity',
        target: '< 100ms',
      },
      CLS: {
        description: 'Cumulative Layout Shift - Visual stability',
        target: '< 0.1',
      },
      FCP: {
        description: 'First Contentful Paint - First visual feedback',
        target: '< 1.8s',
      },
      TTFB: {
        description: 'Time to First Byte - Server response time',
        target: '< 800ms',
      },
      INP: {
        description: 'Interaction to Next Paint - Overall responsiveness',
        target: '< 200ms',
      },
    }

    return info[name] || { description: name, target: 'N/A' }
  }

  const getMetricIcon = (rating: string) => {
    switch (rating) {
      case 'good':
        return <CheckCircle className="w-5 h-5 text-blue-600" />
      case 'needs-improvement':
        return <AlertCircle className="w-5 h-5 text-blue-500" />
      case 'poor':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <Activity className="w-5 h-5 text-gray-500" />
    }
  }

  const getMetricColor = (rating: string) => {
    switch (rating) {
      case 'good':
        return 'text-blue-600'
      case 'needs-improvement':
        return 'text-blue-600'
      case 'poor':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-blue-600'
    if (score >= 70) return 'text-blue-600'
    return 'text-red-600'
  }

  const formatValue = (name: string, value: number) => {
    if (name === 'CLS') {
      return value.toFixed(3)
    }
    return `${Math.round(value)}ms`
  }

  return (
    <div className="space-y-6">
      {/* Performance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Performance Score</span>
            <span className={`text-3xl font-bold ${getScoreColor(performanceScore)}`}>
              {performanceScore}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress 
            value={performanceScore} 
            className="h-4"
          />
          <p className="text-sm text-gray-600 mt-2">
            Based on Core Web Vitals measurements
          </p>
        </CardContent>
      </Card>

      {/* Core Web Vitals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['LCP', 'FID', 'CLS'].map((metricName) => {
          const metric = metrics[metricName]
          const info = getMetricInfo(metricName)

          return (
            <Card key={metricName}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span>{metricName}</span>
                  {metric && getMetricIcon(metric.rating)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className={`text-2xl font-bold ${metric ? getMetricColor(metric.rating) : ''}`}>
                      {metric ? formatValue(metricName, metric.value) : '--'}
                    </span>
                    <span className="text-xs text-gray-500">{info.target}</span>
                  </div>
                  <p className="text-xs text-gray-600">{info.description}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Additional Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['FCP', 'TTFB', 'INP'].map((metricName) => {
              const metric = metrics[metricName]
              const info = getMetricInfo(metricName)

              return (
                <div key={metricName} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{metricName}</span>
                    {metric && getMetricIcon(metric.rating)}
                  </div>
                  <div className={`text-lg font-semibold ${metric ? getMetricColor(metric.rating) : ''}`}>
                    {metric ? formatValue(metricName, metric.value) : '--'}
                  </div>
                  <p className="text-xs text-gray-600">{info.description}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Performance Timeline */}
      {performanceHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Performance Timeline
              <TrendingUp className="w-5 h-5 text-gray-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4">
                <p className="text-sm text-gray-600 mb-3">Recent Performance Metrics</p>
                <div className="space-y-2">
                  {performanceHistory.slice(-5).reverse().map((data, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        {new Date(data.timestamp).toLocaleTimeString()}
                      </span>
                      <div className="flex gap-4">
                        {data.lcp && (
                          <span className="text-blue-600">
                            LCP: {Math.round(data.lcp)}ms
                          </span>
                        )}
                        {data.fid && (
                          <span className="text-blue-600">
                            FID: {Math.round(data.fid)}ms
                          </span>
                        )}
                        {data.cls && (
                          <span className="text-blue-600">
                            CLS: {data.cls.toFixed(3)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center">
                Showing last 5 measurements. Data updates in real-time as users interact with your site.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(metrics).map(([name, metric]) => {
            if (metric.rating === 'poor' || metric.rating === 'needs-improvement') {
              return (
                <Alert key={name}>
                  <Zap className="h-4 w-4" />
                  <AlertDescription>
                    {getRecommendation(name, metric)}
                  </AlertDescription>
                </Alert>
              )
            }
            return null
          })}

          {performanceScore >= 90 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Great job! Your site is performing well. Continue monitoring to maintain this performance.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function getRecommendation(metricName: string, metric: WebVitalMetric): string {
  const recommendations: Record<string, Record<string, string>> = {
    LCP: {
      poor: 'Optimize your largest content element: compress images, use responsive images, and implement lazy loading.',
      'needs-improvement': 'Consider using a CDN, optimizing server response times, and preloading critical resources.',
    },
    FID: {
      poor: 'Reduce JavaScript execution time, break up long tasks, and use web workers for heavy computations.',
      'needs-improvement': 'Defer non-critical JavaScript and optimize third-party script loading.',
    },
    CLS: {
      poor: 'Set explicit dimensions for images and videos, avoid inserting content above existing content.',
      'needs-improvement': 'Reserve space for dynamic content and avoid non-composited animations.',
    },
    FCP: {
      poor: 'Reduce server response time, eliminate render-blocking resources, and minify CSS.',
      'needs-improvement': 'Optimize font loading and reduce the size of render-blocking resources.',
    },
    TTFB: {
      poor: 'Optimize server processing, use a CDN, and implement efficient caching strategies.',
      'needs-improvement': 'Consider upgrading hosting, optimizing database queries, and enabling compression.',
    },
    INP: {
      poor: 'Optimize event handlers, reduce main thread work, and implement request idle callbacks.',
      'needs-improvement': 'Use CSS transforms instead of JavaScript animations and debounce input handlers.',
    },
  }

  return recommendations[metricName]?.[metric.rating] || 
    `Improve ${metricName} by optimizing your site\'s performance.`
}