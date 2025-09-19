import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type StatusType = 
  | 'draft' 
  | 'review' 
  | 'approved' 
  | 'published' 
  | 'archived' 
  | 'pending'
  | 'active'
  | 'inactive'
  | 'scheduled'
  | 'closed'

interface StatusBadgeProps {
  status: StatusType
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const statusConfig = {
  draft: {
    variant: 'secondary' as const,
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    label: 'Draft'
  },
  review: {
    variant: 'outline' as const,
    className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
    label: 'In Review'
  },
  approved: {
    variant: 'outline' as const,
    className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
    label: 'Approved'
  },
  published: {
    variant: 'default' as const,
    className: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300',
    label: 'Published'
  },
  archived: {
    variant: 'outline' as const,
    className: 'bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600',
    label: 'Archived'
  },
  pending: {
    variant: 'outline' as const,
    className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
    label: 'Pending'
  },
  active: {
    variant: 'default' as const,
    className: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300',
    label: 'Active'
  },
  inactive: {
    variant: 'secondary' as const,
    className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    label: 'Inactive'
  },
  scheduled: {
    variant: 'outline' as const,
    className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
    label: 'Scheduled'
  },
  closed: {
    variant: 'outline' as const,
    className: 'bg-red-100 text-red-800 border-red-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
    label: 'Closed'
  }
}

export function StatusBadge({ status, className, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm'
  }

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, sizeClasses[size], className)}
    >
      {config.label}
    </Badge>
  )
}

export default StatusBadge