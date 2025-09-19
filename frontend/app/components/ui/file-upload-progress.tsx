"use client"

import * as React from "react"
import { X, Upload, Check, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Progress } from "./progress"
import { LoadingSpinner } from "./loading-spinner"

export interface FileUploadProgressProps {
  /** File being uploaded */
  file: File
  /** Upload progress (0-100) */
  progress: number
  /** Upload status */
  status: "pending" | "uploading" | "success" | "error"
  /** Error message if upload failed */
  error?: string
  /** Upload speed in bytes/second */
  speed?: number
  /** Estimated time remaining in seconds */
  timeRemaining?: number
  /** Allow canceling upload */
  allowCancel?: boolean
  /** Callback when upload is canceled */
  onCancel?: () => void
  /** Callback when completed upload is dismissed */
  onDismiss?: () => void
  /** Show detailed info */
  showDetails?: boolean
  /** Variant styling */
  variant?: "default" | "compact" | "detailed"
}

export function FileUploadProgress({
  file,
  progress,
  status,
  error,
  speed,
  timeRemaining,
  allowCancel = true,
  onCancel,
  onDismiss,
  showDetails = true,
  variant = "default",
  className,
  ...props
}: FileUploadProgressProps & React.HTMLAttributes<HTMLDivElement>) {
  
  // Format file size
  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
  }

  // Format upload speed
  const formatSpeed = (bytesPerSecond: number): string => {
    return formatFileSize(bytesPerSecond) + '/s'
  }

  // Format time remaining
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    return `${minutes}m ${remainingSeconds}s`
  }

  // Get status icon and colors
  const getStatusDisplay = () => {
    switch (status) {
      case "pending":
        return {
          icon: <Upload className="h-4 w-4" />,
          color: "text-gray-500",
          bgColor: "bg-gray-100 dark:bg-gray-800"
        }
      case "uploading":
        return {
          icon: <LoadingSpinner size="sm" variant="default" />,
          color: "text-blue-600",
          bgColor: "bg-blue-50 dark:bg-blue-900/20"
        }
      case "success":
        return {
          icon: <Check className="h-4 w-4" />,
          color: "text-green-600",
          bgColor: "bg-green-50 dark:bg-green-900/20"
        }
      case "error":
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          color: "text-red-600",
          bgColor: "bg-red-50 dark:bg-red-900/20"
        }
      default:
        return {
          icon: <Upload className="h-4 w-4" />,
          color: "text-gray-500",
          bgColor: "bg-gray-100 dark:bg-gray-800"
        }
    }
  }

  const { icon, color, bgColor } = getStatusDisplay()

  // Compact variant
  if (variant === "compact") {
    return (
      <div 
        className={cn(
          "flex items-center space-x-3 p-3 rounded-lg border",
          bgColor,
          "border-gray-200 dark:border-gray-700",
          className
        )}
        {...props}
      >
        <div className={cn("flex-shrink-0", color)}>
          {icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {file.name}
          </p>
          <div className="mt-1 space-y-1">
            <Progress 
              value={status === "success" ? 100 : progress} 
              variant="gradient"
              size="sm"
            />
          </div>
        </div>
        
        {(allowCancel && status === "uploading" && onCancel) && (
          <button
            onClick={onCancel}
            className="flex-shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        
        {(status === "success" || status === "error") && onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }

  // Default and detailed variants
  return (
    <div 
      className={cn(
        "rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden",
        "bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl",
        "shadow-lg hover:shadow-xl transition-all duration-300",
        className
      )}
      {...props}
    >
      {/* Glass morphism header */}
      <div className={cn(
        "px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50",
        bgColor
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn("p-2 rounded-lg bg-white/50 dark:bg-gray-800/50", color)}>
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {file.name}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {formatFileSize(file.size)}
                {status === "success" && " • Upload complete"}
                {status === "error" && " • Upload failed"}
              </p>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            {(allowCancel && status === "uploading" && onCancel) && (
              <button
                onClick={onCancel}
                className="p-1.5 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                title="Cancel upload"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            )}
            
            {(status === "success" || status === "error") && onDismiss && (
              <button
                onClick={onDismiss}
                className="p-1.5 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                title="Dismiss"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress section */}
      <div className="px-6 py-4 space-y-3">
        {/* Progress bar */}
        <div className="space-y-2">
          <Progress 
            value={status === "success" ? 100 : progress} 
            variant="glass"
            showValue={true}
            className="h-3"
          />
        </div>

        {/* Detailed information */}
        {showDetails && variant === "detailed" && (
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 dark:text-gray-400">
            {status === "uploading" && speed && (
              <div>
                <span className="font-medium">Speed:</span> {formatSpeed(speed)}
              </div>
            )}
            
            {status === "uploading" && timeRemaining && (
              <div>
                <span className="font-medium">Time remaining:</span> {formatTimeRemaining(timeRemaining)}
              </div>
            )}
            
            <div>
              <span className="font-medium">Status:</span>{" "}
              <span className={cn(
                "capitalize font-medium",
                status === "success" && "text-green-600",
                status === "error" && "text-red-600",
                status === "uploading" && "text-blue-600"
              )}>
                {status === "uploading" ? `Uploading... ${Math.round(progress)}%` : status}
              </span>
            </div>
            
            {status === "success" && (
              <div>
                <span className="font-medium">Uploaded:</span> {formatFileSize(file.size)}
              </div>
            )}
          </div>
        )}

        {/* Error message */}
        {status === "error" && error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Multiple files upload progress
export interface MultiFileUploadProgressProps {
  /** Files being uploaded */
  files: Array<{
    file: File
    progress: number
    status: "pending" | "uploading" | "success" | "error"
    error?: string
    id: string
  }>
  /** Overall upload progress */
  overallProgress?: number
  /** Show overall progress */
  showOverallProgress?: boolean
  /** Allow individual file cancellation */
  allowCancel?: boolean
  /** Callback when file upload is canceled */
  onCancelFile?: (fileId: string) => void
  /** Callback when completed file is dismissed */
  onDismissFile?: (fileId: string) => void
  /** Variant for individual file items */
  fileVariant?: "default" | "compact" | "detailed"
}

export function MultiFileUploadProgress({
  files,
  overallProgress,
  showOverallProgress = true,
  allowCancel = true,
  onCancelFile,
  onDismissFile,
  fileVariant = "compact",
  className,
  ...props
}: MultiFileUploadProgressProps & React.HTMLAttributes<HTMLDivElement>) {
  
  const completedFiles = files.filter(f => f.status === "success").length
  const totalFiles = files.length
  const hasErrors = files.some(f => f.status === "error")

  return (
    <div 
      className={cn(
        "space-y-4 p-6 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200 dark:border-gray-700",
        className
      )}
      {...props}
    >
      {/* Overall progress header */}
      {showOverallProgress && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Uploading {totalFiles} file{totalFiles !== 1 ? 's' : ''}
            </h3>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {completedFiles} / {totalFiles} complete
            </span>
          </div>
          
          <Progress 
            value={overallProgress || (completedFiles / totalFiles) * 100}
            variant="gradient"
            showValue={true}
            className="h-3"
          />
          
          {hasErrors && (
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Some files failed to upload
            </p>
          )}
        </div>
      )}

      {/* Individual file progress */}
      <div className="space-y-3">
        {files.map((fileData) => (
          <FileUploadProgress
            key={fileData.id}
            file={fileData.file}
            progress={fileData.progress}
            status={fileData.status}
            error={fileData.error}
            variant={fileVariant}
            allowCancel={allowCancel}
            onCancel={onCancelFile ? () => onCancelFile(fileData.id) : undefined}
            onDismiss={onDismissFile ? () => onDismissFile(fileData.id) : undefined}
          />
        ))}
      </div>
    </div>
  )
}