'use client'

import { Progress } from '@/components/ui/progress'
import { CheckCircle2, X } from 'lucide-react'
import type { UploadProgressProps } from './types'

export function UploadProgress({ uploadQueue }: UploadProgressProps) {
  if (uploadQueue.length === 0) return null

  return (
    <div className="p-4 border-b bg-blue-50">
      <div className="space-y-2">
        {uploadQueue.filter(item => item.status !== 'complete').map((upload, idx) => (
          <div key={idx} className="bg-white p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium truncate flex-1">
                {upload.file.name}
              </span>
              {upload.status === 'complete' && (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
              {upload.status === 'error' && (
                <X className="h-4 w-4 text-red-500" />
              )}
            </div>
            <Progress value={upload.progress} className="h-2" />
            {upload.error && (
              <p className="text-xs text-red-500 mt-1">{upload.error}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}