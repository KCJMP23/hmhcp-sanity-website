'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { 
  Download, 
  RefreshCw, 
  Trash2, 
  HardDrive,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  RotateCcw
} from 'lucide-react'
import type { Backup, RestorePoint } from '@/lib/backup/backup-manager'
import { formatBytes } from '@/lib/backup/backup-manager'

export function BackupHistory() {
  const { toast } = useToast()
  const [backups, setBackups] = useState<Backup[]>([])
  const [restorePoints, setRestorePoints] = useState<RestorePoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRestoring, setIsRestoring] = useState<string | null>(null)

  useEffect(() => {
    loadBackups()
  }, [])

  const loadBackups = async () => {
    try {
      const response = await fetch('/api/admin/backup/history')
      if (!response.ok) throw new Error('Failed to load backups')
      
      const data = await response.json()
      setBackups(data.backups || [])
      setRestorePoints(data.restorePoints || [])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load backup history',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async (backupId: string) => {
    try {
      const response = await fetch(`/api/admin/backup/download/${backupId}`)
      if (!response.ok) throw new Error('Failed to download backup')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = response.headers.get('content-disposition')?.split('filename=')[1] || 'backup.zip'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: 'Success',
        description: 'Backup downloaded successfully'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download backup',
        variant: 'destructive'
      })
    }
  }

  const handleRestore = async (backupId: string) => {
    if (!confirm('Are you sure you want to restore from this backup? This action cannot be undone.')) {
      return
    }

    setIsRestoring(backupId)
    try {
      const response = await fetch(`/api/admin/backup/restore/${backupId}`, {
        method: 'POST'
      })
      
      if (!response.ok) throw new Error('Failed to restore backup')
      
      toast({
        title: 'Success',
        description: 'Backup restored successfully'
      })
      
      // Reload the page after successful restore
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to restore backup',
        variant: 'destructive'
      })
    } finally {
      setIsRestoring(null)
    }
  }

  const handleDelete = async (backupId: string) => {
    if (!confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/backup/${backupId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete backup')
      
      toast({
        title: 'Success',
        description: 'Backup deleted successfully'
      })
      
      loadBackups()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete backup',
        variant: 'destructive'
      })
    }
  }

  const getStatusIcon = (status: Backup['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'in_progress':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: Backup['status']) => {
    const variants = {
      completed: 'default' as const,
      failed: 'destructive' as const,
      in_progress: 'secondary' as const,
      pending: 'secondary' as const
    }
    
    return (
      <Badge variant={variants[status] || 'secondary'} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </Badge>
    )
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Backup History</CardTitle>
              <CardDescription>
                View and manage your backup history
              </CardDescription>
            </div>
            <Button onClick={loadBackups} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <div className="text-center py-12">
              <HardDrive className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No backups found</p>
              <p className="text-sm text-gray-400 mt-1">
                Create your first backup to see it here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {backups.map((backup) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <HardDrive className="h-5 w-5 text-gray-400" />
                      <div>
                        <h4 className="font-medium">{backup.name}</h4>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-gray-500">
                            {backup.created_at && formatDate(backup.created_at)}
                          </span>
                          {backup.size_bytes && (
                            <span className="text-sm text-gray-500">
                              {formatBytes(backup.size_bytes)}
                            </span>
                          )}
                          {backup.file_count && (
                            <span className="text-sm text-gray-500">
                              {backup.file_count} files
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {getStatusBadge(backup.status)}
                    
                    {backup.status === 'completed' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(backup.id!)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(backup.id!)}
                          disabled={isRestoring === backup.id}
                        >
                          {isRestoring === backup.id ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <RotateCcw className="h-4 w-4 mr-1" />
                          )}
                          Restore
                        </Button>
                      </>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(backup.id!)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {restorePoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Restore Points</CardTitle>
            <CardDescription>
              Quick restore from recent successful backups
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {restorePoints.map((point) => (
                <div
                  key={point.backup_id}
                  className="p-4 border rounded-lg hover:border-blue-300 transition-colors cursor-pointer"
                  onClick={() => handleRestore(point.backup_id)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{point.backup_name}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDate(point.created_at)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatBytes(point.size_bytes)}
                      </p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}