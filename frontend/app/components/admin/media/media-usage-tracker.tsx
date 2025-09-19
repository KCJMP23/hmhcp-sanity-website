'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  BarChart3,
  FileWarning,
  Link2,
  Trash2,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'

interface MediaUsage {
  id: string
  filename: string
  file_size: number
  mime_type: string
  usage_count: number
  last_accessed: string
  created_at: string
  usage_locations: Array<{
    type: 'page' | 'post' | 'component'
    title: string
    url: string
    field: string
  }>
  dependencies: Array<{
    id: string
    title: string
    type: string
    critical: boolean
  }>
}

interface UsageStats {
  total_files: number
  used_files: number
  unused_files: number
  total_size: number
  used_size: number
  unused_size: number
  usage_by_type: Record<string, number>
  usage_trend: Array<{ date: string; count: number }>
}

interface MediaUsageTrackerProps {
  mediaId?: string
  onCleanup?: (mediaIds: string[]) => Promise<void>
}

export function MediaUsageTracker({ mediaId, onCleanup }: MediaUsageTrackerProps) {
  const [usageData, setUsageData] = useState<MediaUsage[]>([])
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMedia, setSelectedMedia] = useState<MediaUsage | null>(null)
  const [showDependencyWarning, setShowDependencyWarning] = useState(false)
  const [pendingDeletion, setPendingDeletion] = useState<string[]>([])
  const [cleanupProgress, setCleanupProgress] = useState(0)
  const [isScanning, setIsScanning] = useState(false)

  useEffect(() => {
    loadUsageData()
  }, [mediaId])

  const loadUsageData = async () => {
    setLoading(true)
    try {
      const endpoint = mediaId 
        ? `/api/admin/media/usage/${mediaId}`
        : '/api/admin/media/usage'
      
      const response = await fetch(endpoint)
      const data = await response.json()
      
      if (mediaId) {
        setUsageData([data.usage])
        setStats(data.stats)
      } else {
        setUsageData(data.usage)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to load usage data:', error)
    } finally {
      setLoading(false)
    }
  }

  const scanForOrphaned = async () => {
    setIsScanning(true)
    try {
      const response = await fetch('/api/admin/media/scan-orphaned', {
        method: 'POST'
      })
      const data = await response.json()
      
      // Filter for orphaned media
      const orphaned = data.results.filter((m: MediaUsage) => m.usage_count === 0)
      setUsageData(orphaned)
    } finally {
      setIsScanning(false)
    }
  }

  const checkDependencies = (media: MediaUsage) => {
    if (media.dependencies.some(d => d.critical)) {
      setSelectedMedia(media)
      setShowDependencyWarning(true)
      return false
    }
    return true
  }

  const handleDelete = async (media: MediaUsage) => {
    if (!checkDependencies(media)) return
    
    setPendingDeletion([...pendingDeletion, media.id])
  }

  const handleBulkCleanup = async () => {
    const orphaned = usageData.filter(m => m.usage_count === 0)
    const hasNoDependencies = orphaned.filter(m => 
      !m.dependencies.some(d => d.critical)
    )
    
    if (onCleanup && hasNoDependencies.length > 0) {
      setCleanupProgress(0)
      const total = hasNoDependencies.length
      
      for (let i = 0; i < hasNoDependencies.length; i++) {
        await onCleanup([hasNoDependencies[i].id])
        setCleanupProgress(((i + 1) / total) * 100)
      }
      
      await loadUsageData()
      setCleanupProgress(0)
    }
  }

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const renderUsageGraph = () => {
    if (!stats?.usage_trend) return null
    
    const maxCount = Math.max(...stats.usage_trend.map(d => d.count))
    const barHeight = 120
    
    return (
      <div className="space-y-2">
        <div className="flex items-end gap-1 h-32">
          {stats.usage_trend.map((data, index) => {
            const height = (data.count / maxCount) * barHeight
            return (
              <div
                key={index}
                className="flex-1 bg-primary/20 hover:bg-primary/30 transition-colors relative group"
                style={{ height: `${height}px` }}
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                  {data.count}
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          {stats.usage_trend.map((data, index) => (
            <span key={index}>{new Date(data.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
          ))}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Media</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_files}</div>
              <p className="text-xs text-muted-foreground">{formatBytes(stats.total_size)}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Used Media</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.used_files}</div>
              <p className="text-xs text-muted-foreground">{formatBytes(stats.used_size)}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Unused Media</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.unused_files}</div>
              <p className="text-xs text-muted-foreground">{formatBytes(stats.unused_size)}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Usage Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round((stats.used_files / stats.total_files) * 100)}%
              </div>
              <Progress 
                value={(stats.used_files / stats.total_files) * 100} 
                className="mt-2 h-2"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Usage Tracker */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Media Usage Tracker</CardTitle>
              <CardDescription>
                Track where media files are used and identify unused assets
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={scanForOrphaned}
                disabled={isScanning}
              >
                {isScanning ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <FileWarning className="h-4 w-4" />
                )}
                <span className="ml-2">Scan Orphaned</span>
              </Button>
              {usageData.some(m => m.usage_count === 0) && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkCleanup}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clean Up Unused
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="unused">Unused Media</TabsTrigger>
              <TabsTrigger value="usage-graph">Usage Trends</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {cleanupProgress > 0 && (
                <Alert>
                  <AlertDescription>
                    <div className="flex items-center justify-between mb-2">
                      <span>Cleaning up unused media...</span>
                      <span>{Math.round(cleanupProgress)}%</span>
                    </div>
                    <Progress value={cleanupProgress} />
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                {usageData.map(media => (
                  <div key={media.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{media.filename}</span>
                          {media.usage_count === 0 ? (
                            <Badge variant="outline" className="text-orange-600">
                              Unused
                            </Badge>
                          ) : (
                            <Badge variant="default">
                              {media.usage_count} uses
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {formatBytes(media.file_size)} • {media.mime_type}
                        </div>
                        
                        {media.usage_locations.length > 0 && (
                          <div className="mt-3 space-y-1">
                            <p className="text-sm font-medium">Used in:</p>
                            {media.usage_locations.slice(0, 3).map((location, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm">
                                <Link2 className="h-3 w-3" />
                                <span className="text-muted-foreground">{location.type}:</span>
                                <a 
                                  href={location.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline flex items-center gap-1"
                                >
                                  {location.title}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            ))}
                            {media.usage_locations.length > 3 && (
                              <p className="text-sm text-muted-foreground">
                                +{media.usage_locations.length - 3} more locations
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {media.usage_count === 0 && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(media)}
                            disabled={pendingDeletion.includes(media.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="unused" className="space-y-4">
              {usageData.filter(m => m.usage_count === 0).length === 0 ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    All media files are currently in use. Great job keeping your media library organized!
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  {usageData
                    .filter(m => m.usage_count === 0)
                    .map(media => (
                      <div key={media.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{media.filename}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatBytes(media.file_size)} • Uploaded {new Date(media.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(media)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="usage-graph" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Usage Trend (Last 7 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderUsageGraph()}
                </CardContent>
              </Card>
              
              {stats && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Usage by Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(stats.usage_by_type).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span className="text-sm">{type}</span>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={(count / stats.total_files) * 100} 
                              className="w-24 h-2"
                            />
                            <span className="text-sm text-muted-foreground w-12 text-right">
                              {count}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dependency Warning Dialog */}
      <Dialog open={showDependencyWarning} onOpenChange={setShowDependencyWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Critical Dependencies Detected
            </DialogTitle>
            <DialogDescription>
              This media file has critical dependencies that must be resolved before deletion.
            </DialogDescription>
          </DialogHeader>
          {selectedMedia && (
            <div className="space-y-3">
              <p className="text-sm">
                <strong>{selectedMedia.filename}</strong> is used by:
              </p>
              <div className="space-y-2">
                {selectedMedia.dependencies.map(dep => (
                  <div key={dep.id} className="flex items-center gap-2 text-sm">
                    {dep.critical ? (
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                    <span>{dep.title} ({dep.type})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDependencyWarning(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}