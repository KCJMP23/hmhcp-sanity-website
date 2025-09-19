'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { 
  Play, Pause, SkipBack, SkipForward, Square, Volume2, 
  MousePointer2, Eye, Activity, Clock, Users, Shield,
  Filter, Download, Settings, Maximize2, AlertTriangle
} from 'lucide-react'
import { format } from 'date-fns'

interface AnonymizedEvent {
  type: 'click' | 'scroll' | 'hover' | 'focus' | 'resize' | 'key_press'
  element: string // Anonymized element ID
  timestamp: number
  value?: number // For scroll events, etc.
  coordinates?: { x: number; y: number } // Relative coordinates
  elementType?: string // button, input, link, etc.
  page?: string
}

interface SessionRecording {
  sessionId: string // Anonymized session ID
  userType: 'patient' | 'healthcare_professional' | 'researcher' | 'unknown'
  duration: number
  pageViews: number
  interactions: number
  scrollDepth: number
  exitPage: string
  anonymizedEvents: AnonymizedEvent[]
  recordingStartTime: number
  deviceInfo: {
    type: 'desktop' | 'mobile' | 'tablet'
    viewportWidth: number
    viewportHeight: number
  }
  privacyCompliant: true // Always true for HIPAA compliance
}

interface SessionRecordingProps {
  recordings: SessionRecording[]
  className?: string
  onSessionSelect?: (session: SessionRecording) => void
}

const USER_TYPE_COLORS = {
  patient: '#FF3B30',
  healthcare_professional: '#34C759',
  researcher: '#007AFF',
  unknown: '#8E8E93'
}

const EVENT_COLORS = {
  click: '#FF3B30',
  scroll: '#34C759',
  hover: '#007AFF',
  focus: '#FF9500',
  resize: '#8E8E93',
  key_press: '#AF52DE'
}

export function SessionRecording({
  recordings,
  className = '',
  onSessionSelect
}: SessionRecordingProps) {
  const [selectedSession, setSelectedSession] = useState<SessionRecording | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [filteredRecordings, setFilteredRecordings] = useState(recordings)
  const [filters, setFilters] = useState({
    userType: 'all',
    minDuration: 0,
    maxDuration: 600,
    minInteractions: 0
  })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  // Filter recordings based on criteria
  useEffect(() => {
    let filtered = recordings

    if (filters.userType !== 'all') {
      filtered = filtered.filter(r => r.userType === filters.userType)
    }

    filtered = filtered.filter(r => 
      r.duration / 1000 >= filters.minDuration && 
      r.duration / 1000 <= filters.maxDuration &&
      r.interactions >= filters.minInteractions
    )

    setFilteredRecordings(filtered)
  }, [recordings, filters])

  // Session playback logic
  useEffect(() => {
    if (!selectedSession || !isPlaying) return

    const startTime = Date.now() - (currentTime * 1000)
    
    const animate = () => {
      const elapsed = (Date.now() - startTime) * playbackSpeed / 1000
      setCurrentTime(Math.min(elapsed, selectedSession.duration / 1000))

      if (elapsed < selectedSession.duration / 1000) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setIsPlaying(false)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [selectedSession, isPlaying, playbackSpeed, currentTime])

  // Draw anonymized session visualization
  useEffect(() => {
    if (!selectedSession || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = selectedSession.deviceInfo.viewportWidth
    canvas.height = Math.min(selectedSession.deviceInfo.viewportHeight * 3, 2000) // Max height

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw background
    ctx.fillStyle = '#f8f9fa'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw viewport boundary
    ctx.strokeStyle = '#dee2e6'
    ctx.lineWidth = 2
    ctx.strokeRect(0, 0, canvas.width, selectedSession.deviceInfo.viewportHeight)

    // Get events up to current time
    const currentTimeMs = currentTime * 1000
    const visibleEvents = selectedSession.anonymizedEvents.filter(
      event => event.timestamp <= selectedSession.recordingStartTime + currentTimeMs
    )

    // Draw scroll depth indicator
    const maxScrollDepth = selectedSession.scrollDepth
    if (maxScrollDepth > 0) {
      ctx.fillStyle = 'rgba(52, 199, 89, 0.1)'
      ctx.fillRect(0, 0, canvas.width, (maxScrollDepth / 100) * canvas.height)
    }

    // Draw anonymized interaction points
    visibleEvents.forEach((event, index) => {
      if (!event.coordinates) return

      const { x, y } = event.coordinates
      const color = EVENT_COLORS[event.type] || '#8E8E93'
      const alpha = Math.max(0.3, 1 - (index / visibleEvents.length) * 0.7)

      // Draw event marker
      ctx.fillStyle = color + Math.round(alpha * 255).toString(16).padStart(2, '0')
      ctx.beginPath()
      
      switch (event.type) {
        case 'click':
          ctx.arc(x, y, 8, 0, 2 * Math.PI)
          ctx.fill()
          // Add ripple effect for recent clicks
          if (index >= visibleEvents.length - 5) {
            ctx.strokeStyle = color
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.arc(x, y, 12 + (visibleEvents.length - index) * 3, 0, 2 * Math.PI)
            ctx.stroke()
          }
          break
        case 'hover':
          ctx.fillRect(x - 4, y - 4, 8, 8)
          break
        case 'focus':
          ctx.fillRect(x - 6, y - 2, 12, 4)
          break
        default:
          ctx.arc(x, y, 4, 0, 2 * Math.PI)
          ctx.fill()
      }

      // Draw element type indicator
      if (event.elementType) {
        ctx.fillStyle = '#000'
        ctx.font = '8px SF Pro Text, -apple-system, sans-serif'
        ctx.fillText(event.elementType, x + 10, y - 5)
      }
    })

    // Draw current playback position indicator
    if (isPlaying) {
      ctx.fillStyle = '#007AFF'
      ctx.fillRect(0, 0, canvas.width, 2)
    }

  }, [selectedSession, currentTime, isPlaying])

  const handleSessionSelect = (session: SessionRecording) => {
    setSelectedSession(session)
    setCurrentTime(0)
    setIsPlaying(false)
    onSessionSelect?.(session)
  }

  const togglePlayback = () => {
    setIsPlaying(!isPlaying)
  }

  const resetPlayback = () => {
    setCurrentTime(0)
    setIsPlaying(false)
  }

  const skipTime = (seconds: number) => {
    if (!selectedSession) return
    const newTime = Math.max(0, Math.min(currentTime + seconds, selectedSession.duration / 1000))
    setCurrentTime(newTime)
  }

  // Calculate session statistics
  const sessionStats = selectedSession ? {
    totalEvents: selectedSession.anonymizedEvents.length,
    clickEvents: selectedSession.anonymizedEvents.filter(e => e.type === 'click').length,
    scrollEvents: selectedSession.anonymizedEvents.filter(e => e.type === 'scroll').length,
    hoverEvents: selectedSession.anonymizedEvents.filter(e => e.type === 'hover').length,
    avgEventInterval: selectedSession.duration / selectedSession.anonymizedEvents.length,
    eventTypes: [...new Set(selectedSession.anonymizedEvents.map(e => e.type))].length
  } : null

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'SF Pro Display' }}>
              Anonymized Session Recording
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              HIPAA-compliant session analysis with zero PII storage
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
              <Shield className="h-3 w-3 mr-1" />
              Privacy Protected
            </Badge>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">User Type</label>
            <select 
              value={filters.userType}
              onChange={(e) => setFilters({...filters, userType: e.target.value})}
              className="w-full px-3 py-1 text-sm border border-gray-300 rounded"
            >
              <option value="all">All Users</option>
              <option value="patient">Patients</option>
              <option value="healthcare_professional">Healthcare Professionals</option>
              <option value="researcher">Researchers</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Min Duration</label>
            <Slider
              value={[filters.minDuration]}
              onValueChange={([value]) => setFilters({...filters, minDuration: value})}
              max={600}
              min={0}
              step={30}
            />
            <span className="text-xs text-gray-500">{filters.minDuration}s</span>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Max Duration</label>
            <Slider
              value={[filters.maxDuration]}
              onValueChange={([value]) => setFilters({...filters, maxDuration: value})}
              max={600}
              min={0}
              step={30}
            />
            <span className="text-xs text-gray-500">{filters.maxDuration}s</span>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Min Interactions</label>
            <Slider
              value={[filters.minInteractions]}
              onValueChange={([value]) => setFilters({...filters, minInteractions: value})}
              max={50}
              min={0}
              step={1}
            />
            <span className="text-xs text-gray-500">{filters.minInteractions}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Session List */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">
              Session Recordings ({filteredRecordings.length})
            </h3>
            
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredRecordings.map((recording) => (
                <div
                  key={recording.sessionId}
                  onClick={() => handleSessionSelect(recording)}
                  className={`
                    p-3 rounded-lg border cursor-pointer transition-all duration-200
                    ${selectedSession?.sessionId === recording.sessionId 
                      ? 'border-blue-300 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                    }
                  `}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: USER_TYPE_COLORS[recording.userType] }}
                    />
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {recording.userType.replace('_', ' ')}
                    </span>
                    <Badge variant="outline" className="ml-auto text-xs">
                      {recording.deviceInfo.type}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {Math.round(recording.duration / 1000)}s
                    </div>
                    <div className="flex items-center gap-1">
                      <MousePointer2 className="h-3 w-3" />
                      {recording.interactions}
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {recording.pageViews}
                    </div>
                    <div className="flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      {recording.scrollDepth.toFixed(0)}%
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-gray-500">
                    ID: {recording.sessionId.slice(0, 12)}...
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Session Player */}
          <div className="lg:col-span-2 space-y-4">
            {selectedSession ? (
              <>
                {/* Player Header */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Session Playback
                    </h3>
                    <p className="text-sm text-gray-600">
                      {format(new Date(selectedSession.recordingStartTime), 'MMM dd, yyyy HH:mm:ss')}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline"
                      style={{ 
                        borderColor: USER_TYPE_COLORS[selectedSession.userType],
                        color: USER_TYPE_COLORS[selectedSession.userType]
                      }}
                    >
                      {selectedSession.userType.replace('_', ' ')}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Session Canvas */}
                <div className="relative border border-gray-200 rounded-lg overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-auto max-h-96 bg-white"
                    style={{ 
                      aspectRatio: `${selectedSession.deviceInfo.viewportWidth}/${selectedSession.deviceInfo.viewportHeight}` 
                    }}
                  />
                  
                  {/* Playback overlay */}
                  <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                    {Math.round(currentTime)}s / {Math.round(selectedSession.duration / 1000)}s
                  </div>
                </div>

                {/* Player Controls */}
                <div className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <Progress 
                      value={(currentTime / (selectedSession.duration / 1000)) * 100}
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{Math.round(currentTime)}s</span>
                      <span>{Math.round(selectedSession.duration / 1000)}s</span>
                    </div>
                  </div>

                  {/* Control Buttons */}
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => skipTime(-10)}>
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    
                    <Button variant="outline" size="sm" onClick={togglePlayback}>
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    
                    <Button variant="outline" size="sm" onClick={() => skipTime(10)}>
                      <SkipForward className="h-4 w-4" />
                    </Button>
                    
                    <Button variant="outline" size="sm" onClick={resetPlayback}>
                      <Square className="h-4 w-4" />
                    </Button>

                    <div className="mx-4 flex items-center gap-2">
                      <Volume2 className="h-4 w-4 text-gray-600" />
                      <span className="text-sm">Speed: {playbackSpeed}x</span>
                      <Slider
                        value={[playbackSpeed]}
                        onValueChange={([value]) => setPlaybackSpeed(value)}
                        max={4}
                        min={0.25}
                        step={0.25}
                        className="w-20"
                      />
                    </div>
                  </div>
                </div>

                {/* Session Statistics */}
                {sessionStats && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{sessionStats.totalEvents}</div>
                      <div className="text-xs text-gray-600">Total Events</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">{sessionStats.clickEvents}</div>
                      <div className="text-xs text-gray-600">Clicks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{sessionStats.scrollEvents}</div>
                      <div className="text-xs text-gray-600">Scrolls</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">{sessionStats.hoverEvents}</div>
                      <div className="text-xs text-gray-600">Hovers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">
                        {Math.round(sessionStats.avgEventInterval)}ms
                      </div>
                      <div className="text-xs text-gray-600">Avg Interval</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-600">{sessionStats.eventTypes}</div>
                      <div className="text-xs text-gray-600">Event Types</div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <MousePointer2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Select a session recording to begin analysis</p>
                <p className="text-sm mt-1">All recordings are anonymized and HIPAA-compliant</p>
              </div>
            )}
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-green-600 mt-0.5" />
            <div className="text-sm text-green-800">
              <p className="font-medium">Privacy & Compliance Notice</p>
              <p className="mt-1">
                All session recordings are fully anonymized with no personally identifiable information (PII) stored. 
                Session IDs are generated using one-way hashing, and all data is encrypted at rest and in transit 
                to ensure HIPAA compliance.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}