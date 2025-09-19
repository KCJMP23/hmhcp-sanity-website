'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  MousePointer2, Eye, Activity, TrendingUp, Users, Clock,
  Filter, Download, RefreshCw, Maximize2, Minimize2,
  Play, Pause, SkipForward, Settings
} from 'lucide-react'

interface HeatmapDataPoint {
  x: number
  y: number
  intensity: number
  element?: string
  timestamp: number
  sessionId: string
  userType: 'patient' | 'healthcare_professional' | 'researcher' | 'unknown'
}

interface HeatmapVisualizationProps {
  data: HeatmapDataPoint[]
  width?: number
  height?: number
  page?: string
  userType?: 'all' | 'patient' | 'healthcare_professional' | 'researcher'
  timeRange?: string
  onDataPointClick?: (point: HeatmapDataPoint) => void
  className?: string
}

interface HeatmapConfig {
  radius: number
  opacity: number
  colorScale: 'hot' | 'cool' | 'medical' | 'accessibility'
  showOverlay: boolean
  showGrid: boolean
  binSize: number
}

export function HeatmapVisualization({
  data,
  width = 1200,
  height = 800,
  page,
  userType = 'all',
  timeRange,
  onDataPointClick,
  className = ''
}: HeatmapVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [config, setConfig] = useState<HeatmapConfig>({
    radius: 30,
    opacity: 0.8,
    colorScale: 'medical',
    showOverlay: true,
    showGrid: false,
    binSize: 20
  })

  // Filter data based on user type and time
  const filteredData = useMemo(() => {
    let filtered = data

    if (userType !== 'all') {
      filtered = filtered.filter(point => point.userType === userType)
    }

    if (timeRange) {
      const now = Date.now()
      const timeRangeMs = {
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      }[timeRange] || 24 * 60 * 60 * 1000

      filtered = filtered.filter(point => now - point.timestamp <= timeRangeMs)
    }

    return filtered
  }, [data, userType, timeRange])

  // Color scales for different visualization modes
  const colorScales = {
    hot: ['rgba(0,0,255,', 'rgba(0,255,255,', 'rgba(0,255,0,', 'rgba(255,255,0,', 'rgba(255,0,0,'],
    cool: ['rgba(255,255,255,', 'rgba(200,220,255,', 'rgba(150,180,255,', 'rgba(100,140,255,', 'rgba(50,100,255,'],
    medical: ['rgba(220,245,255,', 'rgba(180,220,255,', 'rgba(100,180,255,', 'rgba(0,120,255,', 'rgba(0,80,200,'],
    accessibility: ['rgba(255,255,0,', 'rgba(255,200,0,', 'rgba(255,150,0,', 'rgba(255,100,0,', 'rgba(255,0,0,']
  }

  // Generate heatmap visualization
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !filteredData.length) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = width
    canvas.height = height

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Create heatmap grid
    const gridWidth = Math.ceil(width / config.binSize)
    const gridHeight = Math.ceil(height / config.binSize)
    const heatmapGrid: number[][] = Array(gridHeight).fill(null).map(() => Array(gridWidth).fill(0))

    // Populate grid with data points
    filteredData.forEach(point => {
      const gridX = Math.floor(point.x / config.binSize)
      const gridY = Math.floor(point.y / config.binSize)
      
      if (gridX >= 0 && gridX < gridWidth && gridY >= 0 && gridY < gridHeight) {
        heatmapGrid[gridY][gridX] += point.intensity
      }
    })

    // Find max intensity for normalization
    const maxIntensity = Math.max(...heatmapGrid.flat())

    // Draw heatmap
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const intensity = heatmapGrid[y][x]
        if (intensity > 0) {
          const normalizedIntensity = intensity / maxIntensity
          const colorIndex = Math.floor(normalizedIntensity * 4)
          const colorArray = colorScales[config.colorScale]
          const color = colorArray[Math.min(colorIndex, colorArray.length - 1)]
          
          ctx.fillStyle = color + (config.opacity * normalizedIntensity) + ')'
          ctx.fillRect(x * config.binSize, y * config.binSize, config.binSize, config.binSize)
        }
      }
    }

    // Add radial blur effect for smoother visualization
    if (config.radius > config.binSize) {
      filteredData.forEach(point => {
        const gradient = ctx.createRadialGradient(
          point.x, point.y, 0,
          point.x, point.y, config.radius
        )
        
        const normalizedIntensity = point.intensity / 100
        const colorArray = colorScales[config.colorScale]
        const colorIndex = Math.floor(normalizedIntensity * 4)
        const color = colorArray[Math.min(colorIndex, colorArray.length - 1)]
        
        gradient.addColorStop(0, color + (config.opacity * normalizedIntensity) + ')')
        gradient.addColorStop(1, color + '0)')
        
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(point.x, point.y, config.radius, 0, 2 * Math.PI)
        ctx.fill()
      })
    }

    // Draw grid overlay if enabled
    if (config.showGrid) {
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'
      ctx.lineWidth = 1
      
      for (let x = 0; x <= width; x += config.binSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }
      
      for (let y = 0; y <= height; y += config.binSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }
    }

  }, [filteredData, width, height, config])

  // Handle canvas click for data point interaction
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onDataPointClick) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // Find closest data point
    const closestPoint = filteredData.reduce((closest, point) => {
      const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2))
      return distance < closest.distance ? { point, distance } : closest
    }, { point: filteredData[0], distance: Infinity })

    if (closestPoint.distance < config.radius) {
      onDataPointClick(closestPoint.point)
    }
  }

  // Calculate heatmap statistics
  const stats = useMemo(() => {
    const totalClicks = filteredData.length
    const uniqueSessions = new Set(filteredData.map(p => p.sessionId)).size
    const avgIntensity = filteredData.reduce((sum, p) => sum + p.intensity, 0) / totalClicks || 0
    const userTypeDistribution = filteredData.reduce((acc, p) => {
      acc[p.userType] = (acc[p.userType] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalClicks,
      uniqueSessions,
      avgIntensity: Math.round(avgIntensity * 100) / 100,
      userTypeDistribution,
      topElements: getTopElements(filteredData),
      clickDensity: totalClicks / ((width * height) / 10000) // clicks per 100px²
    }
  }, [filteredData, width, height])

  const getTopElements = (data: HeatmapDataPoint[]) => {
    const elementCounts = data.reduce((acc, point) => {
      if (point.element) {
        acc[point.element] = (acc[point.element] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    return Object.entries(elementCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([element, count]) => ({ element, count }))
  }

  return (
    <Card className={`${className} ${isFullscreen ? 'fixed inset-0 z-50 m-0' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'SF Pro Display' }}>
              Content Engagement Heatmap
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              HIPAA-compliant click tracking and interaction analysis
              {page && <span className="ml-2">• {page}</span>}
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {filteredData.length} interactions
            </Badge>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Control Panel */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Intensity Radius</label>
            <Slider
              value={[config.radius]}
              onValueChange={([value]) => setConfig({...config, radius: value})}
              max={100}
              min={10}
              step={5}
              className="w-full"
            />
            <span className="text-xs text-gray-500">{config.radius}px</span>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Opacity</label>
            <Slider
              value={[config.opacity * 100]}
              onValueChange={([value]) => setConfig({...config, opacity: value / 100})}
              max={100}
              min={10}
              step={5}
              className="w-full"
            />
            <span className="text-xs text-gray-500">{Math.round(config.opacity * 100)}%</span>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Color Scale</label>
            <Select value={config.colorScale} onValueChange={(value) => setConfig({...config, colorScale: value as any})}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="medical">Medical</SelectItem>
                <SelectItem value="hot">Hot</SelectItem>
                <SelectItem value="cool">Cool</SelectItem>
                <SelectItem value="accessibility">Accessibility</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Bin Size</label>
            <Slider
              value={[config.binSize]}
              onValueChange={([value]) => setConfig({...config, binSize: value})}
              max={50}
              min={5}
              step={5}
              className="w-full"
            />
            <span className="text-xs text-gray-500">{config.binSize}px</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Statistics Panel */}
        <div className="px-6 py-3 bg-white border-b">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">{stats.totalClicks.toLocaleString()}</div>
              <div className="text-xs text-gray-600">Total Clicks</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">{stats.uniqueSessions}</div>
              <div className="text-xs text-gray-600">Unique Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-purple-600">{stats.avgIntensity}</div>
              <div className="text-xs text-gray-600">Avg Intensity</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-orange-600">{stats.clickDensity.toFixed(2)}</div>
              <div className="text-xs text-gray-600">Click Density</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-red-600">
                {Object.keys(stats.userTypeDistribution).length}
              </div>
              <div className="text-xs text-gray-600">User Types</div>
            </div>
          </div>
        </div>

        {/* Heatmap Canvas */}
        <div className="relative overflow-hidden">
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            onClick={handleCanvasClick}
            className="w-full h-auto cursor-crosshair"
            style={{ maxHeight: isFullscreen ? '80vh' : '600px' }}
          />
          
          {config.showOverlay && (
            <div 
              ref={overlayRef}
              className="absolute inset-0 pointer-events-none"
            >
              {/* Overlay elements for better UX */}
            </div>
          )}
        </div>

        {/* Legend and Analysis */}
        <div className="px-6 py-4 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Color Legend */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Interaction Intensity</h4>
              <div className="flex items-center gap-2">
                {colorScales[config.colorScale].map((color, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <div 
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: color + '0.8)' }}
                    />
                    <span className="text-xs text-gray-600">
                      {index === 0 ? 'Low' : index === 4 ? 'High' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Elements */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Most Clicked Elements</h4>
              <div className="space-y-1">
                {stats.topElements.map(({ element, count }, index) => (
                  <div key={element} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 truncate">{element}</span>
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {count}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}