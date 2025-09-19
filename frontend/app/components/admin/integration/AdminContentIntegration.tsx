'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminDataTable } from '../ui/tables/AdminDataTable'
import { AdminModal } from '../ui/modals/AdminModal'
import { AdminToast } from '../ui/notifications/AdminToast'
import { AdminSpinner } from '../ui/loading/AdminSpinner'
import { AdminAlert } from '../ui/notifications/AdminAlert'
import { AdminButton } from '../ui/forms/AdminButton'
import { AdminInput } from '../ui/forms/AdminInput'
import { AdminSelect } from '../ui/forms/AdminSelect'
import { AdminBadge } from '../ui/notifications/AdminBadge'

// Import all new content management components
import { TeamManagement } from '../content/TeamManagement'
import { VersionHistory } from '../content/VersionHistory'
import { VersionComparison } from '../content/VersionComparison'
import { BulkOperationsToolbar } from '../content/BulkOperationsToolbar'
import { BulkSelectionManager } from '../content/BulkSelectionManager'
import { SchedulingDashboard } from '../content/SchedulingDashboard'
import { SchedulingCalendar } from '../content/SchedulingCalendar'
import { WorkflowManager } from '../content/WorkflowManager'
import { ApprovalQueue } from '../content/ApprovalQueue'
import { WorkflowHistory } from '../content/WorkflowHistory'
import { WorkflowAnalytics } from '../content/WorkflowAnalytics'

import { useAuth } from '@/lib/auth/hooks'
import { useAuditLog } from '@/lib/hooks/useAuditLog'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { useCsrf } from '@/lib/hooks/useCsrf'

interface ContentItem {
  id: string
  type: 'blog' | 'page' | 'team' | 'service' | 'platform'
  title: string
  status: 'draft' | 'published' | 'scheduled' | 'archived'
  author: string
  updatedAt: string
  version: number
  workflow?: {
    state: string
    assignee?: string
  }
}

interface IntegrationConfig {
  features: {
    teamManagement: boolean
    versioning: boolean
    bulkOperations: boolean
    scheduling: boolean
    workflow: boolean
  }
  permissions: {
    canEdit: boolean
    canDelete: boolean
    canPublish: boolean
    canApprove: boolean
  }
}

export function AdminContentIntegration() {
  const { user } = useAuth()
  const { logAction } = useAuditLog()
  const { checkPermission } = usePermissions()
  const { showNotification } = useNotifications()
  const { makeSecureRequest, addToHeaders, error: csrfError } = useCsrf()

  const [loading, setLoading] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [activeView, setActiveView] = useState<'list' | 'calendar' | 'workflow'>('list')
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    type: 'delete' | 'publish' | 'archive' | 'version' | 'workflow' | null
    data?: any
  }>({
    isOpen: false,
    type: null
  })

  const [config, setConfig] = useState<IntegrationConfig>({
    features: {
      teamManagement: true,
      versioning: true,
      bulkOperations: true,
      scheduling: true,
      workflow: true
    },
    permissions: {
      canEdit: false,
      canDelete: false,
      canPublish: false,
      canApprove: false
    }
  })

  // Initialize permissions based on user role
  useEffect(() => {
    if (user) {
      setConfig(prev => ({
        ...prev,
        permissions: {
          canEdit: checkPermission('content.edit'),
          canDelete: checkPermission('content.delete'),
          canPublish: checkPermission('content.publish'),
          canApprove: checkPermission('workflow.approve')
        }
      }))
    }
  }, [user, checkPermission])

  // Handle bulk operations with CSRF protection
  const handleBulkAction = useCallback(async (action: string, items: string[]) => {
    setLoading(true)
    try {
      // Check for CSRF errors
      if (csrfError) {
        showNotification({
          type: 'error',
          title: 'Security Error',
          message: 'Please refresh the page to continue'
        })
        return
      }

      logAction({
        action: `bulk_${action}`,
        resource: 'content',
        details: { count: items.length }
      })

      // Use secure request with automatic CSRF token inclusion
      const response = await makeSecureRequest('/api/admin/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, items })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Bulk operation failed')
      }

      showNotification({
        type: 'success',
        title: 'Bulk Operation Complete',
        message: `Successfully ${action}ed ${items.length} items`
      })

      setSelectedItems([])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      // Handle CSRF-specific errors
      if (errorMessage.includes('security token') || errorMessage.includes('CSRF')) {
        showNotification({
          type: 'error',
          title: 'Security Token Invalid',
          message: 'Please refresh the page and try again'
        })
      } else {
        showNotification({
          type: 'error',
          title: 'Operation Failed',
          message: errorMessage
        })
      }
    } finally {
      setLoading(false)
    }
  }, [logAction, showNotification, makeSecureRequest, csrfError])

  // Handle workflow transitions with CSRF protection
  const handleWorkflowTransition = useCallback(async (itemId: string, transition: string) => {
    setLoading(true)
    try {
      // Check for CSRF errors
      if (csrfError) {
        showNotification({
          type: 'error',
          title: 'Security Error',
          message: 'Please refresh the page to continue'
        })
        return
      }

      logAction({
        action: 'workflow_transition',
        resource: 'content',
        resourceId: itemId,
        details: { transition }
      })

      // Use secure request with automatic CSRF token inclusion
      const response = await makeSecureRequest('/api/admin/workflow/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          workflowId: itemId, 
          action: transition,
          comment: `Transition to ${transition}` 
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Workflow transition failed')
      }

      showNotification({
        type: 'success',
        title: 'Workflow Updated',
        message: `Content moved to ${transition}`
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      // Handle CSRF-specific errors
      if (errorMessage.includes('security token') || errorMessage.includes('CSRF')) {
        showNotification({
          type: 'error',
          title: 'Security Token Invalid', 
          message: 'Please refresh the page and try again'
        })
      } else {
        showNotification({
          type: 'error',
          title: 'Transition Failed',
          message: errorMessage
        })
      }
    } finally {
      setLoading(false)
    }
  }, [logAction, showNotification, makeSecureRequest, csrfError])

  // Main content table columns
  const columns = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (item: ContentItem) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{item.title}</span>
          {config.features.versioning && (
            <AdminBadge variant="secondary" size="sm">
              v{item.version}
            </AdminBadge>
          )}
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (item: ContentItem) => (
        <AdminBadge variant="outline">
          {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
        </AdminBadge>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (item: ContentItem) => {
        const statusColors = {
          draft: 'default',
          published: 'success',
          scheduled: 'warning',
          archived: 'secondary'
        } as const
        return (
          <AdminBadge variant={statusColors[item.status]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </AdminBadge>
        )
      }
    },
    {
      key: 'workflow',
      label: 'Workflow',
      render: (item: ContentItem) => {
        if (!config.features.workflow || !item.workflow) return null
        return (
          <div className="flex items-center gap-2">
            <AdminBadge variant="outline">
              {item.workflow.state}
            </AdminBadge>
            {item.workflow.assignee && (
              <span className="text-sm text-muted-foreground">
                → {item.workflow.assignee}
              </span>
            )}
          </div>
        )
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: ContentItem) => (
        <div className="flex items-center gap-2">
          {config.permissions.canEdit && (
            <AdminButton
              size="sm"
              variant="outline"
              onClick={() => handleEdit(item.id)}
            >
              Edit
            </AdminButton>
          )}
          {config.features.versioning && (
            <AdminButton
              size="sm"
              variant="outline"
              onClick={() => handleViewVersions(item.id)}
            >
              History
            </AdminButton>
          )}
          {config.features.workflow && config.permissions.canApprove && (
            <AdminButton
              size="sm"
              variant="outline"
              onClick={() => handleWorkflowAction(item.id)}
            >
              Workflow
            </AdminButton>
          )}
        </div>
      )
    }
  ]

  const handleEdit = (id: string) => {
    logAction({ action: 'edit', resource: 'content', resourceId: id })
    // Navigate to edit page
    window.location.href = `/admin/content/${id}/edit`
  }

  const handleViewVersions = (id: string) => {
    setModalState({
      isOpen: true,
      type: 'version',
      data: { contentId: id }
    })
  }

  const handleWorkflowAction = (id: string) => {
    setModalState({
      isOpen: true,
      type: 'workflow',
      data: { contentId: id }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header with view switcher */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Content Management</h1>
        <div className="flex items-center gap-4">
          <AdminSelect
            value={activeView}
            onValueChange={(value: any) => setActiveView(value)}
            options={[
              { value: 'list', label: 'List View' },
              { value: 'calendar', label: 'Calendar View' },
              { value: 'workflow', label: 'Workflow View' }
            ]}
          />
          <AdminButton
            variant="primary"
            onClick={() => window.location.href = '/admin/content/new'}
          >
            Create New
          </AdminButton>
        </div>
      </div>

      {/* Alerts for system status */}
      {config.features.workflow && (
        <AdminAlert
          type="info"
          title="Pending Approvals"
          message="You have 5 content items awaiting approval"
          action={{
            label: 'View Queue',
            onClick: () => setActiveView('workflow')
          }}
        />
      )}

      {/* Main content area */}
      {loading && (
        <div className="flex justify-center py-8">
          <AdminSpinner size="lg" />
        </div>
      )}

      {!loading && (
        <>
          {/* List View */}
          {activeView === 'list' && (
            <div className="space-y-4">
              {config.features.bulkOperations && (
                <BulkOperationsToolbar
                  selectedCount={selectedItems.length}
                  onAction={handleBulkAction}
                  permissions={config.permissions}
                />
              )}
              <AdminDataTable
                columns={columns}
                data={[]}
                onSelectionChange={setSelectedItems}
                selectable={config.features.bulkOperations}
              />
            </div>
          )}

          {/* Calendar View */}
          {activeView === 'calendar' && config.features.scheduling && (
            <SchedulingCalendar
              onEventClick={(event) => handleEdit(event.id)}
            />
          )}

          {/* Workflow View */}
          {activeView === 'workflow' && config.features.workflow && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ApprovalQueue
                onApprove={(id) => handleWorkflowTransition(id, 'approved')}
                onReject={(id) => handleWorkflowTransition(id, 'rejected')}
              />
              <WorkflowAnalytics />
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <AdminModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, type: null })}
        title={modalState.type === 'version' ? 'Version History' : 'Workflow Management'}
      >
        {modalState.type === 'version' && modalState.data && (
          <VersionHistory contentId={modalState.data.contentId} />
        )}
        {modalState.type === 'workflow' && modalState.data && (
          <WorkflowManager contentId={modalState.data.contentId} />
        )}
      </AdminModal>

      {/* Toast notifications are handled by the useNotifications hook */}
    </div>
  )
}