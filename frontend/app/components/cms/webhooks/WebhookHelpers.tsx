import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertCircle, Clock, RefreshCw, Activity } from 'lucide-react'

export const getStatusIcon = (status: string) => {
  switch (status) {
    case 'success': return <CheckCircle className="w-4 h-4 text-blue-600" />
    case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />
    case 'pending': return <Clock className="w-4 h-4 text-blue-500" />
    case 'retrying': return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
    default: return <Activity className="w-4 h-4 text-gray-500" />
  }
}

export const getStatusBadge = (status: string) => {
  const variants = {
    success: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    failed: 'bg-red-100 text-red-800 dark:bg-blue-900/20 dark:text-blue-400',
    pending: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    retrying: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
  }
  
  return (
    <Badge variant="secondary" className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
      {status}
    </Badge>
  )
}