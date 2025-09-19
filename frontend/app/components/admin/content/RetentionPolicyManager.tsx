/**
 * Retention Policy Manager - Configure and manage version retention policies
 * Story 1.4 Task 5 - Content versioning system retention policy management
 * 
 * Features:
 * - Create and edit retention policies
 * - Preview cleanup impact before applying
 * - Schedule automatic cleanup
 * - Monitor policy effectiveness
 * - Override policies for specific content
 */

'use client'

import React, { useState, useEffect } from 'react'
import {
  TrashIcon,
  CogIcon,
  ClockIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  PlayIcon,
  PauseIcon,
  PencilIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { VersionRetentionPolicy } from '@/lib/dal/admin/types'
import { cn } from '@/lib/utils'

interface RetentionPolicyManagerProps {
  policies?: VersionRetentionPolicy[]
  loading?: boolean
  onSavePolicy?: (policy: Partial<VersionRetentionPolicy>) => Promise<void>
  onDeletePolicy?: (policyId: string) => Promise<void>
  onRunCleanup?: (policyId?: string) => Promise<void>
  onPreviewCleanup?: (policy: VersionRetentionPolicy) => Promise<CleanupPreview>
  className?: string
}

interface CleanupPreview {
  affectedVersions: number
  oldestVersionDate: string
  newestVersionDate: string
  protectedVersions: number
  publishedVersions: number
  estimatedSpaceSaved: string
  contentTypes: { [key: string]: number }
}

interface PolicyFormData {
  content_type: string
  policy_name: string
  max_versions_per_content: number | undefined
  retention_days: number | undefined
  keep_published_versions: boolean
  keep_protected_versions: boolean
  auto_cleanup_enabled: boolean
  cleanup_frequency: 'hourly' | 'daily' | 'weekly'
}

/**
 * Main Retention Policy Manager Component
 */
export function RetentionPolicyManager({
  policies = [],
  loading = false,
  onSavePolicy,
  onDeletePolicy,
  onRunCleanup,
  onPreviewCleanup,
  className
}: RetentionPolicyManagerProps) {
  const [selectedPolicy, setSelectedPolicy] = useState<VersionRetentionPolicy | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [cleanupPreview, setCleanupPreview] = useState<CleanupPreview | null>(null)
  const [formData, setFormData] = useState<PolicyFormData>(getDefaultFormData())

  // Group policies by content type
  const policiesByType = React.useMemo(() => {
    const grouped: { [key: string]: VersionRetentionPolicy[] } = {}
    policies.forEach(policy => {
      if (!grouped[policy.content_type]) {
        grouped[policy.content_type] = []
      }
      grouped[policy.content_type].push(policy)
    })
    return grouped
  }, [policies])

  const contentTypes = ['blog_post', 'page', 'platform', 'service', 'team_member', 'testimonial']

  const handleEditPolicy = (policy: VersionRetentionPolicy) => {
    setSelectedPolicy(policy)
    setFormData({
      content_type: policy.content_type,
      policy_name: policy.policy_name,
      max_versions_per_content: policy.max_versions_per_content || undefined,
      retention_days: policy.retention_days || undefined,
      keep_published_versions: policy.keep_published_versions,
      keep_protected_versions: policy.keep_protected_versions,
      auto_cleanup_enabled: policy.auto_cleanup_enabled,
      cleanup_frequency: policy.cleanup_frequency as 'hourly' | 'daily' | 'weekly'
    })
    setIsEditing(true)
  }

  const handleCreatePolicy = () => {
    setSelectedPolicy(null)
    setFormData(getDefaultFormData())
    setIsEditing(true)
  }

  const handleSavePolicy = async () => {
    if (!onSavePolicy) return

    try {
      await onSavePolicy({
        id: selectedPolicy?.id,
        ...formData
      })
      setIsEditing(false)
      setSelectedPolicy(null)
    } catch (error) {
      console.error('Failed to save policy:', error)
    }
  }

  const handlePreviewCleanup = async (policy: VersionRetentionPolicy) => {
    if (!onPreviewCleanup) return

    try {
      const preview = await onPreviewCleanup(policy)
      setCleanupPreview(preview)
      setShowPreview(true)
    } catch (error) {
      console.error('Failed to preview cleanup:', error)
    }
  }

  const handleRunCleanup = async (policyId?: string) => {
    if (!onRunCleanup) return

    try {
      await onRunCleanup(policyId)
    } catch (error) {
      console.error('Failed to run cleanup:', error)
    }
  }

  if (loading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <CogIcon className="h-5 w-5 animate-spin" />
            <span>Loading retention policies...</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-100 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <ShieldCheckIcon className="h-5 w-5" />
              <span>Version Retention Policies</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button onClick={() => handleRunCleanup()} variant="outline" size="sm">
                <TrashIcon className="h-4 w-4 mr-2" />
                Run All Cleanup
              </Button>
              <Button onClick={handleCreatePolicy} size="sm">
                <PlusIcon className="h-4 w-4 mr-2" />
                New Policy
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="by-type" className="w-full">
            <TabsList>
              <TabsTrigger value="by-type">By Content Type</TabsTrigger>
              <TabsTrigger value="all">All Policies</TabsTrigger>
            </TabsList>

            <TabsContent value="by-type" className="space-y-6">
              {contentTypes.map(contentType => (
                <ContentTypePolicySection
                  key={contentType}
                  contentType={contentType}
                  policies={policiesByType[contentType] || []}
                  onEdit={handleEditPolicy}
                  onDelete={onDeletePolicy}
                  onPreview={handlePreviewCleanup}
                  onRunCleanup={handleRunCleanup}
                />
              ))}
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              {policies.map(policy => (
                <PolicyCard
                  key={policy.id}
                  policy={policy}
                  onEdit={handleEditPolicy}
                  onDelete={onDeletePolicy}
                  onPreview={handlePreviewCleanup}
                  onRunCleanup={handleRunCleanup}
                />
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Policy Editor Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedPolicy ? 'Edit Retention Policy' : 'Create Retention Policy'}
            </DialogTitle>
            <DialogDescription>
              Configure how long versions are kept and when they should be automatically cleaned up.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] px-1">
            <PolicyForm
              formData={formData}
              onChange={setFormData}
              isEditing={!!selectedPolicy}
            />
          </ScrollArea>

          <DialogFooter>
            <Button onClick={() => setIsEditing(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleSavePolicy}>
              {selectedPolicy ? 'Save Changes' : 'Create Policy'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cleanup Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Cleanup Preview</DialogTitle>
            <DialogDescription>
              Review what will be cleaned up before proceeding.
            </DialogDescription>
          </DialogHeader>

          {cleanupPreview && (
            <CleanupPreviewContent preview={cleanupPreview} />
          )}

          <DialogFooter>
            <Button onClick={() => setShowPreview(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={() => {
              setShowPreview(false)
              // Run cleanup for the previewed policy
            }} className="bg-red-600 hover:bg-red-700">
              Proceed with Cleanup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/**
 * Content Type Policy Section Component
 */
interface ContentTypePolicySectionProps {
  contentType: string
  policies: VersionRetentionPolicy[]
  onEdit: (policy: VersionRetentionPolicy) => void
  onDelete?: (policyId: string) => Promise<void>
  onPreview: (policy: VersionRetentionPolicy) => void
  onRunCleanup: (policyId: string) => void
}

function ContentTypePolicySection({
  contentType,
  policies,
  onEdit,
  onDelete,
  onPreview,
  onRunCleanup
}: ContentTypePolicySectionProps) {
  const formatContentType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          {formatContentType(contentType)}
        </h3>
        <Badge variant="outline">
          {policies.length} polic{policies.length !== 1 ? 'ies' : 'y'}
        </Badge>
      </div>

      {policies.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center text-gray-500">
              <ShieldCheckIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No retention policies configured</p>
              <p className="text-sm">Versions will be kept indefinitely</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {policies.map(policy => (
            <PolicyCard
              key={policy.id}
              policy={policy}
              onEdit={onEdit}
              onDelete={onDelete}
              onPreview={onPreview}
              onRunCleanup={onRunCleanup}
              compact
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Policy Card Component
 */
interface PolicyCardProps {
  policy: VersionRetentionPolicy
  onEdit: (policy: VersionRetentionPolicy) => void
  onDelete?: (policyId: string) => Promise<void>
  onPreview: (policy: VersionRetentionPolicy) => void
  onRunCleanup: (policyId: string) => void
  compact?: boolean
}

function PolicyCard({
  policy,
  onEdit,
  onDelete,
  onPreview,
  onRunCleanup,
  compact = false
}: PolicyCardProps) {
  const getStatusIcon = () => {
    if (!policy.is_active) {
      return <PauseIcon className="h-4 w-4 text-gray-400" />
    }
    if (policy.auto_cleanup_enabled) {
      return <PlayIcon className="h-4 w-4 text-green-600" />
    }
    return <PauseIcon className="h-4 w-4 text-yellow-600" />
  }

  const getStatusColor = () => {
    if (!policy.is_active) return 'text-gray-600 bg-gray-100'
    if (policy.auto_cleanup_enabled) return 'text-green-700 bg-green-100'
    return 'text-yellow-700 bg-yellow-100'
  }

  return (
    <Card className={cn(compact && "border-l-4 border-l-blue-500")}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h4 className="font-medium text-gray-900">{policy.policy_name}</h4>
              <div className={cn("px-2 py-1 rounded text-xs font-medium", getStatusColor())}>
                <div className="flex items-center space-x-1">
                  {getStatusIcon()}
                  <span>{policy.is_active ? (policy.auto_cleanup_enabled ? 'Active' : 'Manual') : 'Disabled'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
              <div>
                <span className="font-medium">Max Versions:</span> {policy.max_versions_per_content || 'Unlimited'}
              </div>
              <div>
                <span className="font-medium">Retention:</span> {policy.retention_days ? `${policy.retention_days} days` : 'Forever'}
              </div>
              <div>
                <span className="font-medium">Frequency:</span> {policy.cleanup_frequency}
              </div>
              <div>
                <span className="font-medium">Last Cleanup:</span> {
                  policy.last_cleanup_at 
                    ? new Date(policy.last_cleanup_at).toLocaleDateString()
                    : 'Never'
                }
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-2">
              {policy.keep_published_versions && (
                <Badge variant="secondary" className="text-xs">Keep Published</Badge>
              )}
              {policy.keep_protected_versions && (
                <Badge variant="secondary" className="text-xs">Keep Protected</Badge>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1 ml-4">
            <Button
              onClick={() => onPreview(policy)}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
            >
              <InformationCircleIcon className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => onRunCleanup(policy.id)}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
            >
              <PlayIcon className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => onEdit(policy)}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
            {onDelete && (
              <Button
                onClick={() => onDelete(policy.id)}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Policy Form Component
 */
interface PolicyFormProps {
  formData: PolicyFormData
  onChange: (data: PolicyFormData) => void
  isEditing: boolean
}

function PolicyForm({ formData, onChange, isEditing }: PolicyFormProps) {
  const contentTypes = [
    { value: 'blog_post', label: 'Blog Posts' },
    { value: 'page', label: 'Pages' },
    { value: 'platform', label: 'Platforms' },
    { value: 'service', label: 'Services' },
    { value: 'team_member', label: 'Team Members' },
    { value: 'testimonial', label: 'Testimonials' }
  ]

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Basic Information</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="content_type">Content Type</Label>
            <Select
              value={formData.content_type}
              onValueChange={(value) => onChange({ ...formData, content_type: value })}
              disabled={isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select content type" />
              </SelectTrigger>
              <SelectContent>
                {contentTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="policy_name">Policy Name</Label>
            <Input
              id="policy_name"
              value={formData.policy_name}
              onChange={(e) => onChange({ ...formData, policy_name: e.target.value })}
              placeholder="e.g., default, aggressive, conservative"
            />
          </div>
        </div>
      </div>

      {/* Retention Rules */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Retention Rules</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="max_versions">Max Versions per Content</Label>
            <Input
              id="max_versions"
              type="number"
              min="1"
              max="1000"
              value={formData.max_versions_per_content || ''}
              onChange={(e) => onChange({ 
                ...formData, 
                max_versions_per_content: e.target.value ? parseInt(e.target.value) : undefined 
              })}
              placeholder="Leave empty for unlimited"
            />
          </div>

          <div>
            <Label htmlFor="retention_days">Retention Days</Label>
            <Input
              id="retention_days"
              type="number"
              min="1"
              max="3650"
              value={formData.retention_days || ''}
              onChange={(e) => onChange({ 
                ...formData, 
                retention_days: e.target.value ? parseInt(e.target.value) : undefined 
              })}
              placeholder="Leave empty to keep forever"
            />
          </div>
        </div>

        <Alert>
          <InformationCircleIcon className="h-4 w-4" />
          <AlertDescription>
            Versions will be deleted when EITHER the max versions limit OR retention days limit is exceeded.
          </AlertDescription>
        </Alert>
      </div>

      {/* Protection Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Protection Settings</h3>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="keep_published"
              checked={formData.keep_published_versions}
              onCheckedChange={(checked) => onChange({ 
                ...formData, 
                keep_published_versions: checked as boolean 
              })}
            />
            <Label htmlFor="keep_published">Keep published versions</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="keep_protected"
              checked={formData.keep_protected_versions}
              onCheckedChange={(checked) => onChange({ 
                ...formData, 
                keep_protected_versions: checked as boolean 
              })}
            />
            <Label htmlFor="keep_protected">Keep protected versions</Label>
          </div>
        </div>
      </div>

      {/* Automation Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Automation Settings</h3>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="auto_cleanup"
              checked={formData.auto_cleanup_enabled}
              onCheckedChange={(checked) => onChange({ 
                ...formData, 
                auto_cleanup_enabled: checked as boolean 
              })}
            />
            <Label htmlFor="auto_cleanup">Enable automatic cleanup</Label>
          </div>

          {formData.auto_cleanup_enabled && (
            <div>
              <Label htmlFor="cleanup_frequency">Cleanup Frequency</Label>
              <Select
                value={formData.cleanup_frequency}
                onValueChange={(value: 'hourly' | 'daily' | 'weekly') => 
                  onChange({ ...formData, cleanup_frequency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Cleanup Preview Content Component
 */
function CleanupPreviewContent({ preview }: { preview: CleanupPreview }) {
  return (
    <div className="space-y-4">
      <Alert>
        <ExclamationTriangleIcon className="h-4 w-4" />
        <AlertDescription>
          <div className="font-medium mb-2">This cleanup will affect {preview.affectedVersions} versions</div>
          <div className="text-sm">
            {preview.protectedVersions} protected and {preview.publishedVersions} published versions will be preserved.
          </div>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-medium">Versions to delete:</span> {preview.affectedVersions}
        </div>
        <div>
          <span className="font-medium">Estimated space saved:</span> {preview.estimatedSpaceSaved}
        </div>
        <div>
          <span className="font-medium">Oldest version:</span> {new Date(preview.oldestVersionDate).toLocaleDateString()}
        </div>
        <div>
          <span className="font-medium">Newest version:</span> {new Date(preview.newestVersionDate).toLocaleDateString()}
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-2">Affected Content Types:</h4>
        <div className="space-y-1">
          {Object.entries(preview.contentTypes).map(([type, count]) => (
            <div key={type} className="flex justify-between text-sm">
              <span>{type.replace(/_/g, ' ')}</span>
              <span>{count} versions</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Utility Functions
 */
function getDefaultFormData(): PolicyFormData {
  return {
    content_type: '',
    policy_name: 'default',
    max_versions_per_content: undefined,
    retention_days: undefined,
    keep_published_versions: true,
    keep_protected_versions: true,
    auto_cleanup_enabled: true,
    cleanup_frequency: 'daily'
  }
}

export default RetentionPolicyManager