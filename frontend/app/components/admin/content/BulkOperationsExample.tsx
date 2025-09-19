/**
 * Bulk Operations Example Integration
 * Demonstrates how to integrate bulk operations with AdminDataTable
 */

import React, { useState, useCallback } from 'react'
import { AdminDataTable } from '../ui/tables/AdminDataTable'
import { BulkOperationsToolbar } from './BulkOperationsToolbar'
import { BulkSelectionProvider, useBulkSelection } from './BulkSelectionManager'
import type { BulkOperation, BulkOperationResult } from '@/lib/types/bulk-operations'
import type { AdminDataTableColumn } from '../ui/types'

// Sample data structure
interface SampleContentItem {
  id: string
  title: string
  status: 'draft' | 'published' | 'archived'
  category: string
  author: string
  publishedAt: string
  createdAt: string
  updatedAt: string
}

interface BulkOperationsExampleProps {
  contentType: 'pages' | 'posts' | 'services' | 'platforms' | 'team-members' | 'testimonials'
  data: SampleContentItem[]
  loading?: boolean
}

/**
 * Inner component that uses bulk selection context
 */
function BulkEnabledDataTable({
  contentType,
  data,
  loading
}: BulkOperationsExampleProps) {
  const {
    selectedIds,
    selectedCount,
    isAllSelected,
    isIndeterminate,
    toggleItem,
    toggleAll,
    clearSelection
  } = useBulkSelection()

  // Define table columns
  const columns: AdminDataTableColumn<SampleContentItem>[] = [
    {
      field: 'title',
      label: 'Title',
      searchable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <div>
            <div className="font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">{row.category}</div>
          </div>
        </div>
      )
    },
    {
      field: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          value === 'published' ? 'bg-green-100 text-green-800' :
          value === 'draft' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      )
    },
    {
      field: 'author',
      label: 'Author',
      searchable: true
    },
    {
      field: 'publishedAt',
      label: 'Published',
      type: 'date'
    },
    {
      field: 'updatedAt',
      label: 'Last Updated',
      type: 'date'
    }
  ]

  // Handle bulk operations
  const handleBulkOperation = useCallback(async (operation: BulkOperation): Promise<BulkOperationResult> => {
    console.log('Executing bulk operation:', operation)
    
    try {
      // Get the actual selected IDs from the data
      const actualSelectedIds = data
        .filter(item => selectedIds.has(item.id))
        .map(item => item.id)

      const requestBody = {
        ...operation,
        selectedIds: actualSelectedIds
      }

      // Call the bulk operations API
      const response = await fetch('/api/admin/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Operation failed')
      }

      const result: BulkOperationResult = await response.json()
      
      // Show success/error notifications
      if (result.success) {
        console.log(`✅ Bulk ${operation.action} completed: ${result.successCount} items processed`)
        
        // Refresh data after successful operations
        if (['delete', 'publish', 'unpublish', 'archive'].includes(operation.action)) {
          // In a real app, you would refresh the data from the server
          window.location.reload()
        }
      } else {
        console.error(`❌ Bulk ${operation.action} had errors:`, result.errors)
      }

      return result
    } catch (error) {
      console.error('Bulk operation failed:', error)
      
      return {
        success: false,
        successCount: 0,
        errorCount: selectedIds.size,
        processedIds: [],
        failedIds: [...selectedIds],
        errors: [{ id: 'general', error: error instanceof Error ? error.message : 'Unknown error' }],
        warnings: []
      }
    }
  }, [selectedIds, data])

  const handleSelectAll = useCallback(() => {
    toggleAll(data.map(item => item.id))
  }, [toggleAll, data])

  return (
    <div className="space-y-4">
      {/* Bulk Operations Toolbar */}
      <BulkOperationsToolbar
        selectedCount={selectedCount}
        totalCount={data.length}
        contentType={contentType}
        isAllSelected={isAllSelected}
        isIndeterminate={isIndeterminate}
        onSelectAll={handleSelectAll}
        onClearSelection={clearSelection}
        onBulkOperation={handleBulkOperation}
        disabled={loading}
      />

      {/* Data Table with Selection */}
      <AdminDataTable
        data={data}
        columns={columns}
        selectable={true}
        searchable={true}
        sortable={true}
        loading={loading}
        emptyMessage={`No ${contentType} found`}
        selectedRows={selectedIds}
        onRowSelection={(id) => toggleItem(id)}
        onSelectAll={handleSelectAll}
        isAllSelected={isAllSelected}
        isIndeterminate={isIndeterminate}
      />
    </div>
  )
}

/**
 * Main component with bulk selection provider
 */
export function BulkOperationsExample({
  contentType,
  data,
  loading = false
}: BulkOperationsExampleProps) {
  return (
    <BulkSelectionProvider
      config={{
        maxSelection: 1000, // Limit bulk operations to 1000 items
        persistSelection: false,
        storageKey: `bulk-selection-${contentType}`,
        onSelectionChange: (state) => {
          console.log(`Selection changed: ${state.selectedCount} items selected`)
        },
        onMaxSelectionReached: (max) => {
          alert(`Maximum selection limit reached: ${max} items`)
        }
      }}
      totalItems={data.length}
      allIds={data.map(item => item.id)}
    >
      <BulkEnabledDataTable
        contentType={contentType}
        data={data}
        loading={loading}
      />
    </BulkSelectionProvider>
  )
}

/**
 * Example usage with sample data
 */
export function BulkOperationsExampleDemo() {
  const [loading, setLoading] = useState(false)

  // Sample data
  const sampleData: SampleContentItem[] = [
    {
      id: '1',
      title: 'Getting Started with Healthcare Technology',
      status: 'published',
      category: 'Technology',
      author: 'Dr. Smith',
      publishedAt: '2024-01-15T10:00:00Z',
      createdAt: '2024-01-10T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      title: 'HIPAA Compliance Best Practices',
      status: 'draft',
      category: 'Compliance',
      author: 'Jane Doe',
      publishedAt: '',
      createdAt: '2024-01-12T14:30:00Z',
      updatedAt: '2024-01-12T14:30:00Z'
    },
    {
      id: '3',
      title: 'Patient Data Security Guidelines',
      status: 'published',
      category: 'Security',
      author: 'Dr. Johnson',
      publishedAt: '2024-01-20T09:15:00Z',
      createdAt: '2024-01-18T09:15:00Z',
      updatedAt: '2024-01-20T09:15:00Z'
    },
    {
      id: '4',
      title: 'Archived Medical Records Management',
      status: 'archived',
      category: 'Management',
      author: 'Admin User',
      publishedAt: '2023-12-01T11:00:00Z',
      createdAt: '2023-11-25T11:00:00Z',
      updatedAt: '2024-01-01T11:00:00Z'
    }
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Bulk Operations Demo
        </h1>
        <p className="text-gray-600 mt-2">
          This example demonstrates the comprehensive bulk operations interface.
          Try selecting multiple items and using the bulk actions.
        </p>
      </div>

      <BulkOperationsExample
        contentType="posts"
        data={sampleData}
        loading={loading}
      />

      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Available Operations:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>Publish/Unpublish:</strong> Change content visibility</li>
          <li>• <strong>Archive:</strong> Move items to archived status</li>
          <li>• <strong>Delete:</strong> Permanently remove items (with confirmation)</li>
          <li>• <strong>Duplicate:</strong> Create copies of selected items</li>
          <li>• <strong>Bulk Tag:</strong> Add/remove/replace tags</li>
          <li>• <strong>SEO Update:</strong> Update meta information</li>
          <li>• <strong>Export:</strong> Download selected data in various formats</li>
          <li>• <strong>Import:</strong> Upload new content with validation</li>
        </ul>
      </div>
    </div>
  )
}