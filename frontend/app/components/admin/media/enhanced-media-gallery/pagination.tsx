'use client'

import { Button } from '@/components/ui/button'
import type { PaginationProps } from './types'

export function Pagination({ pagination, onPageChange }: PaginationProps) {
  if (pagination.totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between pt-6 border-t mt-6">
      <div className="text-sm text-gray-600">
        Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
        {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
        {pagination.total} items
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          disabled={pagination.page <= 1}
          onClick={() => onPageChange(pagination.page - 1)}
          className="rounded-lg"
        >
          Previous
        </Button>
        <span className="text-sm text-gray-600">
          Page {pagination.page} of {pagination.totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => onPageChange(pagination.page + 1)}
          className="rounded-lg"
        >
          Next
        </Button>
      </div>
    </div>
  )
}