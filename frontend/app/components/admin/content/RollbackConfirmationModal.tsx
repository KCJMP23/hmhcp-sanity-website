/**
 * Rollback Confirmation Modal - Safe rollback with change preview and confirmation
 * Story 1.4 Task 5 - Content versioning system rollback confirmation
 * 
 * Features:
 * - Detailed change preview before rollback
 * - Warning messages for destructive operations
 * - Reason input for audit trail
 * - Safety checks and validation
 * - Loading states during rollback
 */

'use client'

import React, { useState, useEffect } from 'react'
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
  ClockIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { ContentVersion, VersionDiff } from '@/lib/dal/admin/types'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface RollbackConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string, confirmed: boolean) => Promise<void>
  currentVersion?: ContentVersion
  targetVersion?: ContentVersion
  diff?: VersionDiff | null
  loading?: boolean
  contentType: string
  className?: string
}

interface RollbackRisk {
  level: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  icon: React.ReactNode
}

/**
 * Main Rollback Confirmation Modal Component
 */
export function RollbackConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  currentVersion,
  targetVersion,
  diff,
  loading = false,
  contentType,
  className
}: RollbackConfirmationModalProps) {
  const [reason, setReason] = useState('')
  const [understood, setUnderstood] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setReason('')
      setUnderstood(false)
      setConfirmed(false)
      setShowDetails(false)
    }
  }, [isOpen])

  // Calculate rollback risks
  const rollbackRisks = getRollbackRisks(currentVersion, targetVersion, diff)
  const highestRiskLevel = getHighestRiskLevel(rollbackRisks)
  
  const canConfirm = reason.trim() && understood && confirmed && !loading

  const handleConfirm = async () => {
    if (!canConfirm) return
    
    try {
      await onConfirm(reason.trim(), true)
      onClose()
    } catch (error) {
      // Error handling is done in parent component
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  if (!currentVersion || !targetVersion) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={cn("max-w-2xl max-h-[90vh] overflow-hidden", className)}>
        <DialogHeader className="space-y-4">
          <DialogTitle className="flex items-center space-x-2">
            <ArrowPathIcon className="h-5 w-5 text-orange-600" />
            <span>Confirm Version Rollback</span>
          </DialogTitle>
          <DialogDescription>
            This action will rollback your content to a previous version. Please review the changes
            carefully before proceeding.
          </DialogDescription>

          {/* Risk Level Alert */}
          <RiskLevelAlert level={highestRiskLevel} />
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[60vh] px-1">
          <div className="space-y-6">
            {/* Version Comparison */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Version Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Current Version */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant="destructive">Current</Badge>
                    <span className="font-medium">Version {currentVersion.version_number}</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{currentVersion.title}</p>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>Created: {formatDistanceToNow(new Date(currentVersion.created_at), { addSuffix: true })}</div>
                    <div>Branch: {currentVersion.branch_name}</div>
                    {currentVersion.is_published && <div className="text-green-600">Published</div>}
                  </div>
                </div>

                {/* Target Version */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge className="bg-orange-600">Rolling back to</Badge>
                    <span className="font-medium">Version {targetVersion.version_number}</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{targetVersion.title}</p>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>Created: {formatDistanceToNow(new Date(targetVersion.created_at), { addSuffix: true })}</div>
                    <div>Branch: {targetVersion.branch_name}</div>
                    {targetVersion.is_published && <div className="text-green-600">Published</div>}
                  </div>
                </div>
              </div>
            </div>

            {/* Change Summary */}
            {diff && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">Changes Summary</h3>
                  <Button
                    onClick={() => setShowDetails(!showDetails)}
                    variant="ghost"
                    size="sm"
                  >
                    {showDetails ? 'Hide Details' : 'Show Details'}
                  </Button>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-medium text-green-600">+{diff.summary.additions}</div>
                      <div className="text-xs text-gray-600">Additions</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-blue-600">{diff.summary.modifications}</div>
                      <div className="text-xs text-gray-600">Modified</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-red-600">-{diff.summary.deletions}</div>
                      <div className="text-xs text-gray-600">Deletions</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-900">{diff.summary.totalChanges}</div>
                      <div className="text-xs text-gray-600">Total</div>
                    </div>
                  </div>
                </div>

                {showDetails && diff.changes.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Detailed Changes</h4>
                    <div className="bg-white border rounded max-h-40 overflow-y-auto">
                      {diff.changes.slice(0, 10).map((change, index) => (
                        <div key={index} className="px-3 py-2 border-b border-gray-100 last:border-b-0">
                          <div className="flex items-center space-x-2">
                            <ChangeTypeBadge type={change.type} />
                            <span className="text-xs font-mono text-gray-600">{change.path}</span>
                          </div>
                          {change.description && (
                            <p className="text-xs text-gray-500 mt-1">{change.description}</p>
                          )}
                        </div>
                      ))}
                      {diff.changes.length > 10 && (
                        <div className="px-3 py-2 text-xs text-gray-500 text-center">
                          And {diff.changes.length - 10} more changes...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Risk Assessment */}
            {rollbackRisks.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900">Risk Assessment</h3>
                <div className="space-y-2">
                  {rollbackRisks.map((risk, index) => (
                    <div key={index} className={cn(
                      "flex items-start space-x-3 p-3 rounded-lg border",
                      getRiskStyles(risk.level)
                    )}>
                      <div className="flex-shrink-0 mt-0.5">
                        {risk.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-medium">{risk.title}</h4>
                        <p className="text-sm opacity-90">{risk.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Reason Input */}
            <div className="space-y-2">
              <Label htmlFor="rollback-reason">
                Rollback Reason <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="rollback-reason"
                placeholder="Please provide a reason for this rollback (required for audit trail)..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[80px]"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                This reason will be recorded in the audit log and cannot be changed later.
              </p>
            </div>

            {/* Confirmations */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="understand"
                  checked={understood}
                  onCheckedChange={(checked) => setUnderstood(checked as boolean)}
                  disabled={loading}
                />
                <div className="text-sm">
                  <Label htmlFor="understand" className="font-normal cursor-pointer">
                    I understand that this rollback will create a new version and cannot be undone.
                    The current version will be preserved in the history.
                  </Label>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="confirm"
                  checked={confirmed}
                  onCheckedChange={(checked) => setConfirmed(checked as boolean)}
                  disabled={loading}
                />
                <div className="text-sm">
                  <Label htmlFor="confirm" className="font-normal cursor-pointer">
                    I confirm that I want to proceed with this rollback operation.
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex items-center space-x-2">
          <Button
            onClick={handleClose}
            variant="outline"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {loading ? (
              <>
                <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                Rolling back...
              </>
            ) : (
              <>
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Confirm Rollback
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Risk Level Alert Component
 */
function RiskLevelAlert({ level }: { level: 'low' | 'medium' | 'high' | 'critical' }) {
  const alerts = {
    low: {
      variant: 'default' as const,
      icon: <InformationCircleIcon className="h-4 w-4" />,
      title: 'Low Risk Operation',
      description: 'This rollback is relatively safe with minimal impact.'
    },
    medium: {
      variant: 'default' as const,
      icon: <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600" />,
      title: 'Medium Risk Operation',
      description: 'This rollback may have some impact. Please review the changes carefully.'
    },
    high: {
      variant: 'destructive' as const,
      icon: <ExclamationTriangleIcon className="h-4 w-4" />,
      title: 'High Risk Operation',
      description: 'This rollback involves significant changes. Proceed with caution.'
    },
    critical: {
      variant: 'destructive' as const,
      icon: <ExclamationTriangleIcon className="h-4 w-4" />,
      title: 'Critical Risk Operation',
      description: 'This rollback involves major changes that could significantly impact your content.'
    }
  }

  const alert = alerts[level]

  return (
    <Alert variant={alert.variant}>
      {alert.icon}
      <AlertDescription>
        <div className="font-medium">{alert.title}</div>
        <div className="text-sm mt-1">{alert.description}</div>
      </AlertDescription>
    </Alert>
  )
}

/**
 * Change Type Badge Component
 */
function ChangeTypeBadge({ type }: { type: string }) {
  const badges = {
    added: <Badge className="bg-green-600 text-white text-xs">Added</Badge>,
    removed: <Badge variant="destructive" className="text-xs">Removed</Badge>,
    modified: <Badge className="bg-blue-600 text-white text-xs">Modified</Badge>,
    moved: <Badge className="bg-purple-600 text-white text-xs">Moved</Badge>
  }

  return badges[type as keyof typeof badges] || <Badge variant="outline" className="text-xs">{type}</Badge>
}

/**
 * Utility Functions
 */
function getRollbackRisks(
  currentVersion?: ContentVersion,
  targetVersion?: ContentVersion,
  diff?: VersionDiff | null
): RollbackRisk[] {
  const risks: RollbackRisk[] = []

  if (!currentVersion || !targetVersion || !diff) return risks

  // Version age risk
  const currentDate = new Date(currentVersion.created_at)
  const targetDate = new Date(targetVersion.created_at)
  const daysDiff = (currentDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24)

  if (daysDiff > 30) {
    risks.push({
      level: 'high',
      title: 'Rolling back to old version',
      description: `Target version is ${Math.round(daysDiff)} days old. You may lose recent improvements.`,
      icon: <ClockIcon className="h-4 w-4 text-orange-600" />
    })
  }

  // Published content risk
  if (currentVersion.is_published && !targetVersion.is_published) {
    risks.push({
      level: 'critical',
      title: 'Rolling back published content to draft',
      description: 'This will unpublish your content, making it invisible to users.',
      icon: <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
    })
  }

  // Large change volume risk
  if (diff.summary.totalChanges > 50) {
    risks.push({
      level: 'high',
      title: 'Large number of changes',
      description: `This rollback involves ${diff.summary.totalChanges} changes. Review carefully.`,
      icon: <DocumentTextIcon className="h-4 w-4 text-orange-600" />
    })
  }

  // High deletion risk
  if (diff.summary.deletions > 20) {
    risks.push({
      level: 'medium',
      title: 'Many deletions',
      description: `${diff.summary.deletions} fields will be removed. Ensure this is intentional.`,
      icon: <XMarkIcon className="h-4 w-4 text-red-600" />
    })
  }

  return risks
}

function getHighestRiskLevel(risks: RollbackRisk[]): 'low' | 'medium' | 'high' | 'critical' {
  if (risks.some(r => r.level === 'critical')) return 'critical'
  if (risks.some(r => r.level === 'high')) return 'high'
  if (risks.some(r => r.level === 'medium')) return 'medium'
  return 'low'
}

function getRiskStyles(level: RollbackRisk['level']): string {
  const styles = {
    low: 'bg-blue-50 border-blue-200 text-blue-800',
    medium: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    high: 'bg-orange-50 border-orange-200 text-orange-800',
    critical: 'bg-red-50 border-red-200 text-red-800'
  }
  return styles[level]
}

export default RollbackConfirmationModal