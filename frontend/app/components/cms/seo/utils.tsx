import { AlertCircle, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-blue-600'
  if (score >= 60) return 'text-blue-600'
  return 'text-red-600'
}

export const getScoreBackground = (score: number) => {
  if (score >= 80) return 'bg-blue-100 dark:bg-blue-900/20'
  if (score >= 60) return 'bg-blue-100 dark:bg-blue-900/20'
  return 'bg-red-100 dark:bg-blue-900/20'
}

export const getIssueIcon = (type: string) => {
  switch (type) {
    case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />
    case 'warning': return <AlertCircle className="w-4 h-4 text-blue-500" />
    default: return <Info className="w-4 h-4 text-blue-500" />
  }
}

export const getPriorityBadge = (priority: string) => {
  const variants = {
    high: 'bg-red-100 text-red-800 dark:bg-blue-900/20 dark:text-blue-400',
    medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
  }
  return (
    <Badge variant="secondary" className={variants[priority as keyof typeof variants]}>
      {priority}
    </Badge>
  )
}

export const getScoreDescription = (score: number) => {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  return 'Needs Improvement'
}