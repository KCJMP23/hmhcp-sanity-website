'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Save, Loader2, Shield, Database, FileText, Settings, Image } from 'lucide-react'
import type { BackupConfig } from '@/lib/backup/backup-manager'

interface BackupConfigFormProps {
  config?: BackupConfig
  onSave?: () => void
}

export function BackupConfigForm({ config, onSave }: BackupConfigFormProps) {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<BackupConfig>({
    name: config?.name || '',
    frequency: config?.frequency || 'daily',
    retention_days: config?.retention_days || 30,
    include_media: config?.include_media ?? true,
    include_database: config?.include_database ?? true,
    include_content: config?.include_content ?? true,
    include_settings: config?.include_settings ?? true,
    encryption_enabled: config?.encryption_enabled || false,
    storage_location: config?.storage_location || 'local',
    is_active: config?.is_active ?? true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const response = await fetch('/api/admin/backup/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, id: config?.id })
      })

      if (!response.ok) {
        throw new Error('Failed to save backup configuration')
      }

      toast({
        title: 'Success',
        description: 'Backup configuration saved successfully'
      })

      if (onSave) onSave()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save backup configuration',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Backup Configuration</CardTitle>
          <CardDescription>
            Configure automated backups for your healthcare platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Configuration Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Daily Full Backup"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="frequency">Backup Frequency</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value: BackupConfig['frequency']) => 
                  setFormData({ ...formData, frequency: value })
                }
              >
                <SelectTrigger id="frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="retention">Retention Period (days)</Label>
              <Input
                id="retention"
                type="number"
                min="1"
                max="365"
                value={formData.retention_days}
                onChange={(e) => setFormData({ ...formData, retention_days: parseInt(e.target.value) || 30 })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="storage">Storage Location</Label>
            <Select
              value={formData.storage_location}
              onValueChange={(value: BackupConfig['storage_location']) => 
                setFormData({ ...formData, storage_location: value })
              }
            >
              <SelectTrigger id="storage">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="local">Local Storage</SelectItem>
                <SelectItem value="cloud">Cloud Storage</SelectItem>
                <SelectItem value="both">Both Local & Cloud</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backup Content</CardTitle>
          <CardDescription>
            Select what data to include in backups
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Database className="h-5 w-5 text-blue-600" />
                <div>
                  <Label htmlFor="include_database" className="text-base">Database</Label>
                  <p className="text-sm text-gray-500">Include all database tables</p>
                </div>
              </div>
              <Switch
                id="include_database"
                checked={formData.include_database}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, include_database: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-green-600" />
                <div>
                  <Label htmlFor="include_content" className="text-base">Content</Label>
                  <p className="text-sm text-gray-500">Include pages and blog posts</p>
                </div>
              </div>
              <Switch
                id="include_content"
                checked={formData.include_content}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, include_content: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Image className="h-5 w-5 text-purple-600" />
                <div>
                  <Label htmlFor="include_media" className="text-base">Media Files</Label>
                  <p className="text-sm text-gray-500">Include uploaded images and documents</p>
                </div>
              </div>
              <Switch
                id="include_media"
                checked={formData.include_media}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, include_media: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Settings className="h-5 w-5 text-orange-600" />
                <div>
                  <Label htmlFor="include_settings" className="text-base">Settings</Label>
                  <p className="text-sm text-gray-500">Include SEO and email settings</p>
                </div>
              </div>
              <Switch
                id="include_settings"
                checked={formData.include_settings}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, include_settings: checked })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>
            Configure backup security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-5 w-5 text-indigo-600" />
              <div>
                <Label htmlFor="encryption" className="text-base">Encryption</Label>
                <p className="text-sm text-gray-500">Encrypt backup files for security</p>
              </div>
            </div>
            <Switch
              id="encryption"
              checked={formData.encryption_enabled}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, encryption_enabled: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="active" className="text-base">Active</Label>
              <p className="text-sm text-gray-500">Enable automated backups</p>
            </div>
            <Switch
              id="active"
              checked={formData.is_active}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, is_active: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Configuration
            </>
          )}
        </Button>
      </div>
    </form>
  )
}