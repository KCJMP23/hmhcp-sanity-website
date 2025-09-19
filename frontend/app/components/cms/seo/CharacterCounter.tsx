'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface CharacterCounterProps {
  value: string
  onChange: (value: string) => void
  maxLength: number
  warningLength: number
  placeholder?: string
  textarea?: boolean
  disabled?: boolean
  className?: string
}

export function CharacterCounter({
  value,
  onChange,
  maxLength,
  warningLength,
  placeholder,
  textarea = false,
  disabled = false,
  className
}: CharacterCounterProps) {
  const length = value.length
  const remaining = maxLength - length
  const isWarning = length >= warningLength
  const isError = length > maxLength
  
  const getCounterColor = () => {
    if (isError) return 'text-red-600'
    if (isWarning) return 'text-blue-600'
    return 'text-gray-500'
  }
  
  const Component = textarea ? Textarea : Input
  
  return (
    <div className="relative">
      <Component
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'pr-16',
          isError && 'border-red-500 focus:ring-blue-500',
          isWarning && !isError && 'border-blue-500 focus:ring-blue-500',
          className
        )}
      />
      <div className={cn(
        'absolute right-2 bottom-2 text-xs font-medium',
        getCounterColor()
      )}>
        {length}/{maxLength}
      </div>
      {isError && (
        <p className="text-xs text-red-600 mt-1">
          Character limit exceeded by {Math.abs(remaining)} characters
        </p>
      )}
      {isWarning && !isError && (
        <p className="text-xs text-blue-600 mt-1">
          {remaining} characters remaining
        </p>
      )}
    </div>
  )
}