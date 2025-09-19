'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Progress } from '@/components/ui/progress'
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  FileText, 
  Eye, 
  Shield, 
  Scale,
  Archive,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WorkflowState, WorkflowInstance } from '@/lib/dal/workflow'

interface WorkflowStatusIndicatorProps {
  state: WorkflowState
  instance?: WorkflowInstance
  showProgress?: boolean
  showIcon?: boolean
  showDescription?: boolean
  variant?: 'default' | 'minimal' | 'detailed'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const stateIcons = {
  draft: FileText,
  content_review: Eye,
  medical_review: Shield,
  legal_review: Scale,
  approved: CheckCircle,
  published: CheckCircle,
  needs_revision: AlertCircle,
  rejected: XCircle,
  archived: Archive
}

const stateColors = {
  draft: 'bg-gray-500',
  content_review: 'bg-amber-500',
  medical_review: 'bg-red-500',
  legal_review: 'bg-purple-500',
  approved: 'bg-green-500',
  published: 'bg-green-600',
  needs_revision: 'bg-orange-500',
  rejected: 'bg-red-600',
  archived: 'bg-gray-500'
}

const priorityColors = {
  low: 'text-blue-600 bg-blue-50 border-blue-200',
  normal: 'text-gray-600 bg-gray-50 border-gray-200',
  high: 'text-orange-600 bg-orange-50 border-orange-200',
  urgent: 'text-red-600 bg-red-50 border-red-200'
}

const priorityIcons = {
  low: Clock,
  normal: Clock,
  high: AlertCircle,
  urgent: Zap
}

// Calculate workflow progress percentage
function calculateProgress(state: WorkflowState): number {
  const stateOrder = [
    'draft',
    'content_review',
    'medical_review', 
    'legal_review',
    'approved',
    'published'
  ]
  
  const currentIndex = stateOrder.indexOf(state.name)
  if (currentIndex === -1) return 0
  
  if (state.name === 'published') return 100
  if (state.name === 'needs_revision') return Math.max(0, currentIndex - 1) / (stateOrder.length - 1) * 100
  if (state.name === 'rejected') return 0
  if (state.name === 'archived') return 100
  
  return (currentIndex / (stateOrder.length - 1)) * 100
}

// Get time-sensitive styling
function getTimeSensitiveStyle(instance?: WorkflowInstance) {
  if (!instance?.due_date) return {}
  
  const now = new Date()
  const dueDate = new Date(instance.due_date)
  const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)
  
  if (hoursUntilDue < 0) {
    return { className: 'animate-pulse border-red-500', isOverdue: true }
  } else if (hoursUntilDue < 24) {
    return { className: 'border-orange-500', isDueSoon: true }
  } else if (hoursUntilDue < 72) {
    return { className: 'border-yellow-500', isDueThisWeek: true }
  }
  
  return {}
}

export default function WorkflowStatusIndicator({
  state,
  instance,
  showProgress = false,
  showIcon = true,
  showDescription = false,
  variant = 'default',
  size = 'md',
  className
}: WorkflowStatusIndicatorProps) {
  const Icon = stateIcons[state.name as keyof typeof stateIcons] || FileText
  const progress = calculateProgress(state)
  const timeStyle = getTimeSensitiveStyle(instance)
  
  const sizeClasses = {
    sm: 'h-6 px-2 text-xs',
    md: 'h-8 px-3 text-sm',
    lg: 'h-10 px-4 text-base'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  if (variant === 'minimal') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full font-medium transition-all duration-200',
                sizeClasses[size],
                timeStyle.className,
                className
              )}
              style={{ backgroundColor: state.color, color: 'white' }}
            >
              {showIcon && <Icon className={iconSizes[size]} />}
              <span className="truncate">{state.name.replace('_', ' ')}</span>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium">{state.name.replace('_', ' ').toUpperCase()}</p>
              {state.description && <p className="text-sm text-gray-600">{state.description}</p>}
              {instance?.due_date && (
                <p className="text-xs text-gray-500">
                  Due: {new Date(instance.due_date).toLocaleDateString()}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (variant === 'detailed') {
    return (
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={cn(
          'rounded-lg border bg-white p-4 shadow-sm',
          timeStyle.className,
          className
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="p-2 rounded-full"
              style={{ backgroundColor: `${state.color}20`, color: state.color }}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">
                {state.name.replace('_', ' ').toUpperCase()}
              </h4>
              {state.description && (
                <p className="text-sm text-gray-600">{state.description}</p>
              )}
            </div>
          </div>

          {instance?.priority && (
            <Badge
              variant="outline"
              className={cn(
                'ml-2',
                priorityColors[instance.priority]
              )}
            >
              {React.createElement(priorityIcons[instance.priority], {
                className: 'h-3 w-3 mr-1'
              })}
              {instance.priority}
            </Badge>
          )}
        </div>

        {/* Progress */}
        {showProgress && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress 
              value={progress} 
              className="h-2"
              style={{ 
                '--progress-background': state.color 
              } as React.CSSProperties}
            />
          </div>
        )}

        {/* Metadata */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          {instance?.assigned_to && (
            <div className="flex items-center gap-1">
              <span className="font-medium">Assigned to:</span>
              <span>{instance.assigned_user?.email || 'Unknown'}</span>
            </div>
          )}
          
          {instance?.due_date && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span className={cn(
                timeStyle.isOverdue && 'text-red-600 font-medium',
                timeStyle.isDueSoon && 'text-orange-600 font-medium'
              )}>
                Due: {new Date(instance.due_date).toLocaleDateString()}
                {timeStyle.isOverdue && ' (Overdue)'}
                {timeStyle.isDueSoon && ' (Due Soon)'}
              </span>
            </div>
          )}

          {instance?.started_at && (
            <div className="flex items-center gap-1">
              <span className="font-medium">Started:</span>
              <span>{new Date(instance.started_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Special indicators */}
        <AnimatePresence>
          {(state.medical_review_required || state.legal_review_required) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-gray-200"
            >
              <div className="flex gap-2">
                {state.medical_review_required && (
                  <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200">
                    <Shield className="h-3 w-3 mr-1" />
                    Medical Review Required
                  </Badge>
                )}
                {state.legal_review_required && (
                  <Badge variant="outline" className="text-purple-600 bg-purple-50 border-purple-200">
                    <Scale className="h-3 w-3 mr-1" />
                    Legal Review Required
                  </Badge>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  // Default variant
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border font-medium transition-all duration-200',
        sizeClasses[size],
        timeStyle.className,
        className
      )}
      style={{ 
        backgroundColor: `${state.color}15`,
        borderColor: state.color,
        color: state.color
      }}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      <span className="truncate">{state.name.replace('_', ' ')}</span>
      
      {instance?.priority && instance.priority !== 'normal' && (
        <Badge
          variant="outline"
          className={cn('text-xs border-0', priorityColors[instance.priority])}
        >
          {instance.priority}
        </Badge>
      )}
      
      {showProgress && (
        <div className="ml-2 flex items-center gap-1">
          <div className="h-1.5 w-8 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: state.color }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
          </div>
          <span className="text-xs">{Math.round(progress)}%</span>
        </div>
      )}
      
      {timeStyle.isOverdue && (
        <motion.div
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="h-2 w-2 bg-red-500 rounded-full"
        />
      )}
    </motion.div>
  )
}

// Workflow Progress Timeline
export function WorkflowProgressTimeline({
  states,
  currentStateId,
  transitions = [],
  className
}: {
  states: WorkflowState[]
  currentStateId?: string
  transitions?: any[]
  className?: string
}) {
  const stateOrder = [
    'draft',
    'content_review',
    'medical_review',
    'legal_review', 
    'approved',
    'published'
  ]

  const orderedStates = states.sort((a, b) => {
    const aIndex = stateOrder.indexOf(a.name)
    const bIndex = stateOrder.indexOf(b.name)
    return aIndex - bIndex
  })

  const currentIndex = orderedStates.findIndex(s => s.id === currentStateId)

  return (
    <div className={cn('space-y-4', className)}>
      {orderedStates.map((state, index) => {
        const isCompleted = index < currentIndex
        const isCurrent = state.id === currentStateId
        const isPending = index > currentIndex

        return (
          <div key={state.id} className="flex items-center gap-4">
            {/* Status Indicator */}
            <motion.div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-200',
                isCompleted && 'bg-green-500 border-green-500 text-white',
                isCurrent && 'bg-blue-500 border-blue-500 text-white scale-110',
                isPending && 'bg-gray-100 border-gray-300 text-gray-400'
              )}
              whileHover={{ scale: 1.1 }}
            >
              {isCompleted ? (
                <CheckCircle className="h-4 w-4" />
              ) : isCurrent ? (
                <Clock className="h-4 w-4" />
              ) : (
                React.createElement(stateIcons[state.name as keyof typeof stateIcons] || Clock, {
                  className: 'h-4 w-4'
                })
              )}
            </motion.div>

            {/* State Info */}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className={cn(
                  'font-medium',
                  isCompleted && 'text-green-700',
                  isCurrent && 'text-blue-700',
                  isPending && 'text-gray-500'
                )}>
                  {state.name.replace('_', ' ').toUpperCase()}
                </h4>
                
                {transitions.find(t => t.to_state_id === state.id) && (
                  <span className="text-xs text-gray-500">
                    {new Date(transitions.find(t => t.to_state_id === state.id).created_at).toLocaleDateString()}
                  </span>
                )}
              </div>
              
              {state.description && (
                <p className={cn(
                  'text-sm mt-1',
                  isCompleted && 'text-green-600',
                  isCurrent && 'text-blue-600', 
                  isPending && 'text-gray-400'
                )}>
                  {state.description}
                </p>
              )}
            </div>

            {/* Connection Line */}
            {index < orderedStates.length - 1 && (
              <div className="absolute left-4 mt-8 h-6 w-0.5 bg-gray-200" />
            )}
          </div>
        )
      })}
    </div>
  )
}