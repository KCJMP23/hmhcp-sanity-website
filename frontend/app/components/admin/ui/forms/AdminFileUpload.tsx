/**
 * Admin File Upload Component
 * Drag-and-drop file upload with healthcare compliance
 */

import React, { forwardRef, useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Upload, X, File, FileText, Image, Film, Music, Archive, AlertCircle } from 'lucide-react'
import type { AdminFileUploadProps } from '../types'

const FILE_ICONS: Record<string, React.ReactNode> = {
  'image': <Image className="h-5 w-5" />,
  'video': <Film className="h-5 w-5" />,
  'audio': <Music className="h-5 w-5" />,
  'archive': <Archive className="h-5 w-5" />,
  'text': <FileText className="h-5 w-5" />,
  'default': <File className="h-5 w-5" />,
}

export const AdminFileUpload = forwardRef<HTMLInputElement, AdminFileUploadProps>(
  ({
    id,
    name,
    label,
    accept,
    multiple,
    maxSize,
    maxFiles,
    error,
    helper,
    required,
    disabled,
    onChange,
    onRemove,
    healthcare,
    variant = 'default',
    className,
    ...props
  }, ref) => {
    const [isDragging, setIsDragging] = useState(false)
    const [files, setFiles] = useState<File[]>([])
    const [errors, setErrors] = useState<string[]>([])
    const inputRef = useRef<HTMLInputElement>(null)
    const combinedRef = ref || inputRef

    const variantClasses = {
      default: 'border-2 border-dashed border-gray-300 hover:border-blue-500',
      outline: 'border-2 border-solid border-gray-400 hover:border-blue-600',
      filled: 'bg-gray-50 border-2 border-dashed border-gray-200 hover:bg-white hover:border-blue-500',
      ghost: 'border-2 border-dashed border-transparent bg-transparent hover:bg-gray-50 hover:border-gray-300',
    }

    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
    }

    const getFileType = (file: File) => {
      const type = file.type.split('/')[0]
      if (type === 'image' || type === 'video' || type === 'audio') return type
      if (file.type.includes('zip') || file.type.includes('rar')) return 'archive'
      if (file.type.includes('text') || file.type.includes('document')) return 'text'
      return 'default'
    }

    const validateFile = (file: File): string | null => {
      if (maxSize && file.size > maxSize) {
        return `File "${file.name}" exceeds maximum size of ${formatFileSize(maxSize)}`
      }
      
      if (accept) {
        const acceptedTypes = accept.split(',').map(t => t.trim())
        const fileExt = '.' + file.name.split('.').pop()?.toLowerCase()
        const isAccepted = acceptedTypes.some(type => {
          if (type.startsWith('.')) return type === fileExt
          if (type.endsWith('/*')) return file.type.startsWith(type.replace('/*', ''))
          return file.type === type
        })
        
        if (!isAccepted) {
          return `File type "${fileExt}" is not accepted`
        }
      }
      
      return null
    }

    const handleFiles = (fileList: FileList | null) => {
      if (!fileList) return
      
      const newFiles = Array.from(fileList)
      const validFiles: File[] = []
      const newErrors: string[] = []
      
      if (maxFiles && files.length + newFiles.length > maxFiles) {
        newErrors.push(`Maximum ${maxFiles} files allowed`)
        setErrors(newErrors)
        return
      }
      
      newFiles.forEach(file => {
        const error = validateFile(file)
        if (error) {
          newErrors.push(error)
        } else {
          validFiles.push(file)
        }
      })
      
      if (validFiles.length > 0) {
        const updatedFiles = multiple ? [...files, ...validFiles] : validFiles
        setFiles(updatedFiles)
        onChange?.(updatedFiles as any)
      }
      
      if (newErrors.length > 0) {
        setErrors(newErrors)
        setTimeout(() => setErrors([]), 5000)
      }
    }

    const handleDragEnter = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!disabled) setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!disabled) setIsDragging(false)
    }

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      
      if (!disabled) {
        handleFiles(e.dataTransfer.files)
      }
    }

    const handleFileRemove = (index: number) => {
      const updatedFiles = files.filter((_, i) => i !== index)
      setFiles(updatedFiles)
      onChange?.(updatedFiles as any)
      onRemove?.(files[index])
    }

    const isHealthcareField = healthcare?.medicalDataType === 'PHI' || healthcare?.medicalDataType === 'PII'

    return (
      <div className="admin-fileupload-container">
        {label && (
          <label
            htmlFor={id || name}
            className={cn(
              'block text-sm font-medium text-gray-700 mb-1',
              required && "after:content-['*'] after:ml-0.5 after:text-red-500"
            )}
          >
            {label}
            {isHealthcareField && (
              <span className="ml-1 text-xs text-gray-500">
                ({healthcare?.medicalDataType} - Encrypted Upload)
              </span>
            )}
          </label>
        )}

        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={cn(
            'relative rounded-lg p-6 text-center cursor-pointer transition-all duration-200',
            variantClasses[variant],
            isDragging && 'border-blue-500 bg-blue-50',
            disabled && 'opacity-50 cursor-not-allowed',
            error && 'border-red-500',
            className
          )}
          onClick={() => !disabled && (combinedRef as any).current?.click()}
        >
          <input
            ref={combinedRef as React.Ref<HTMLInputElement>}
            id={id || name}
            name={name}
            type="file"
            accept={accept}
            multiple={multiple}
            required={required && files.length === 0}
            disabled={disabled}
            onChange={(e) => handleFiles(e.target.files)}
            className="sr-only"
            aria-invalid={!!error}
            aria-describedby={
              error ? `${id || name}-error` : helper ? `${id || name}-helper` : undefined
            }
            {...props}
          />

          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          
          <p className="text-sm font-medium text-gray-700">
            {isDragging ? 'Drop files here' : 'Drop files here or click to upload'}
          </p>
          
          <p className="text-xs text-gray-500 mt-1">
            {accept && `Accepted: ${accept}`}
            {maxSize && ` • Max size: ${formatFileSize(maxSize)}`}
            {maxFiles && ` • Max files: ${maxFiles}`}
          </p>

          {healthcare?.hipaaCompliant && (
            <p className="text-xs text-blue-600 mt-2">
              🔒 HIPAA-compliant upload • Files encrypted during transfer
            </p>
          )}
        </div>

        {/* File list */}
        {files.length > 0 && (
          <ul className="mt-3 space-y-2">
            {files.map((file, index) => (
              <li
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {FILE_ICONS[getFileType(file)]}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleFileRemove(index)
                  }}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div className="mt-2 space-y-1">
            {errors.map((err, index) => (
              <p key={index} className="text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {err}
              </p>
            ))}
          </div>
        )}

        {error && (
          <p id={`${id || name}-error`} className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}

        {helper && !error && (
          <p id={`${id || name}-helper`} className="mt-1 text-sm text-gray-500">
            {helper}
          </p>
        )}
      </div>
    )
  }
)

AdminFileUpload.displayName = 'AdminFileUpload'