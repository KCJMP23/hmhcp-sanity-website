'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Activity, Database, Server, HardDrive, AlertCircle, CheckCircle } from 'lucide-react'

interface ServiceStatus {
  status: 'operational' | 'degraded' | 'down'
  latency?: number
}

interface SystemStatus {
  services: {
    database: ServiceStatus
    redis: ServiceStatus
    api: ServiceStatus & { endpoints?: Record<string, string> }
    storage: ServiceStatus
  }
  overall?: {
    status: string
    score: number
  }
  uptime?: number
}

export function SystemStatusWidget() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/admin/dashboard/system-status')
        if (response.ok) {
          const data = await response.json()
          setStatus(data)
        }
      } catch (error) {
        console.error('Failed to fetch system status:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 10000) // Update every 10 seconds
    return () => clearInterval(interval)
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational':
        return <Badge className="bg-green-500">✓ Operational</Badge>
      case 'degraded':
        return <Badge className="bg-yellow-500">⚠ Degraded</Badge>
      case 'down':
        return <Badge className="bg-red-500">✗ Down</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'degraded':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'down':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Status
          </span>
          {status?.overall && (
            <Badge variant={status.overall.status === 'healthy' ? 'default' : 'destructive'}>
              {status.overall.score}% Healthy
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Overall Status */}
          {status?.overall && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Health</span>
                <span className="font-medium">{status.overall.score}%</span>
              </div>
              <Progress value={status.overall.score} className="h-2" />
            </div>
          )}

          {/* Uptime */}
          {status?.uptime && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Uptime</span>
              <span className="font-medium">{formatUptime(status.uptime)}</span>
            </div>
          )}

          {/* Services */}
          <div className="space-y-3">
            <div className="text-sm font-medium">Services</div>
            
            {/* Database */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Database</span>
              </div>
              <div className="flex items-center gap-2">
                {status?.services.database.latency && (
                  <span className="text-xs text-muted-foreground">
                    {status.services.database.latency}ms
                  </span>
                )}
                {getStatusIcon(status?.services.database.status || 'unknown')}
              </div>
            </div>

            {/* Redis Cache */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Redis Cache</span>
              </div>
              <div className="flex items-center gap-2">
                {status?.services.redis.latency && (
                  <span className="text-xs text-muted-foreground">
                    {status.services.redis.latency}ms
                  </span>
                )}
                {getStatusIcon(status?.services.redis.status || 'unknown')}
              </div>
            </div>

            {/* API */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">API Services</span>
              </div>
              {getStatusIcon(status?.services.api.status || 'unknown')}
            </div>

            {/* Storage */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Storage</span>
              </div>
              {getStatusIcon(status?.services.storage.status || 'unknown')}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}