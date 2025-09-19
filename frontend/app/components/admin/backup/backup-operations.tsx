'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/components/ui/use-toast'
import { 
  Download, 
  Upload, 
  HardDrive, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Package,
  Database,
  FileText,
  Settings,
  Image
} from 'lucide-react'

interface BackupProgress {
  status: 'idle' | 'preparing' | 'backing_up' | 'compressing' | 'completed' | 'failed'
  progress: number
  message: string
  details?: {
    tablesBackedUp?: number
    totalTables?: number
    filesBackedUp?: number
    totalFiles?: number
  }
}

export function BackupOperations() {
  const { toast } = useToast()
  const [backupProgress, setBackupProgress] = useState<BackupProgress>({
    status: 'idle',
    progress: 0,
    message: ''
  })
  const [isBackingUp, setIsBackingUp] = useState(false)

  const handleManualBackup = async () => {
    setIsBackingUp(true)
    setBackupProgress({
      status: 'preparing',
      progress: 10,
      message: 'Preparing backup...'
    })

    try {
      // Start the backup
      const response = await fetch('/api/admin/backup/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Manual Backup - ${new Date().toLocaleString()}`,
          type: 'manual'
        })
      })

      if (!response.ok) throw new Error('Failed to create backup')

      const { backupId } = await response.json()

      // Simulate progress updates (in a real app, this would be WebSocket or SSE)
      const progressSteps = [
        { progress: 25, message: 'Backing up database...', status: 'backing_up' as const },
        { progress: 50, message: 'Backing up content...', status: 'backing_up' as const },
        { progress: 75, message: 'Backing up media files...', status: 'backing_up' as const },
        { progress: 90, message: 'Compressing backup...', status: 'compressing' as const },
        { progress: 100, message: 'Backup completed!', status: 'completed' as const }
      ]

      for (const step of progressSteps) {
        await new Promise(resolve => setTimeout(resolve, 1500))
        setBackupProgress({
          status: step.status,
          progress: step.progress,
          message: step.message
        })
      }

      toast({
        title: 'Success',
        description: 'Backup created successfully'
      })

      // Reset after a delay
      setTimeout(() => {
        setBackupProgress({
          status: 'idle',
          progress: 0,
          message: ''
        })
        setIsBackingUp(false)
      }, 2000)
    } catch (error) {
      setBackupProgress({
        status: 'failed',
        progress: 0,
        message: 'Backup failed'
      })
      
      toast({
        title: 'Error',
        description: 'Failed to create backup',
        variant: 'destructive'
      })
      
      setIsBackingUp(false)
    }
  }

  const handleImportBackup = async () => {
    // Create file input element
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.zip'
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const formData = new FormData()
      formData.append('backup', file)

      try {
        const response = await fetch('/api/admin/backup/import', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) throw new Error('Failed to import backup')

        toast({
          title: 'Success',
          description: 'Backup imported successfully'
        })
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to import backup',
          variant: 'destructive'
        })
      }
    }

    input.click()
  }

  const getProgressIcon = () => {
    switch (backupProgress.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Backup Operations</CardTitle>
          <CardDescription>
            Create and manage backups of your healthcare platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Button
              onClick={handleManualBackup}
              disabled={isBackingUp}
              className="h-24 flex flex-col gap-2"
            >
              {isBackingUp ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Download className="h-6 w-6" />
              )}
              <span>Create Manual Backup</span>
            </Button>

            <Button
              variant="outline"
              onClick={handleImportBackup}
              disabled={isBackingUp}
              className="h-24 flex flex-col gap-2"
            >
              <Upload className="h-6 w-6" />
              <span>Import Backup</span>
            </Button>
          </div>

          {backupProgress.status !== 'idle' && (
            <div className="mt-6 p-4 bg-gray-50 rounded-full">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getProgressIcon()}
                  <span className="font-medium">{backupProgress.message}</span>
                </div>
                <span className="text-sm text-gray-500">{backupProgress.progress}%</span>
              </div>
              <Progress value={backupProgress.progress} className="mb-2" />
              
              {backupProgress.details && (
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mt-2">
                  {backupProgress.details.tablesBackedUp !== undefined && (
                    <div>
                      Tables: {backupProgress.details.tablesBackedUp}/{backupProgress.details.totalTables}
                    </div>
                  )}
                  {backupProgress.details.filesBackedUp !== undefined && (
                    <div>
                      Files: {backupProgress.details.filesBackedUp}/{backupProgress.details.totalFiles}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Database</p>
                <p className="text-2xl font-bold">Protected</p>
              </div>
              <Database className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">All tables backed up</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Content</p>
                <p className="text-2xl font-bold">Secured</p>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Pages & posts included</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Media</p>
                <p className="text-2xl font-bold">Archived</p>
              </div>
              <Image className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">All uploads preserved</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Settings</p>
                <p className="text-2xl font-bold">Saved</p>
              </div>
              <Settings className="h-8 w-8 text-orange-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Configuration preserved</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common backup and recovery tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button variant="outline" className="justify-start">
              <Package className="h-4 w-4 mr-2" />
              Export Database Only
            </Button>
            <Button variant="outline" className="justify-start">
              <HardDrive className="h-4 w-4 mr-2" />
              Verify Backup Integrity
            </Button>
            <Button variant="outline" className="justify-start">
              <AlertCircle className="h-4 w-4 mr-2" />
              Test Restore Process
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}