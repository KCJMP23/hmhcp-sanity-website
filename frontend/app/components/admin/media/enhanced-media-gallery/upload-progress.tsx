'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { UploadProgressProps } from './types'

export function UploadProgress({ uploadProgress }: UploadProgressProps) {
  if (Object.keys(uploadProgress).length === 0) return null

  return (
    <Card className="rounded-2xl border-blue-200 bg-blue-50 dark:bg-blue-950/20">
      <CardContent className="pt-6">
        <div className="space-y-3">
          {Object.entries(uploadProgress).map(([filename, progress]) => (
            <div key={filename} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-text text-blue-700 dark:text-blue-300">{filename}</span>
                <span className="text-blue-600 dark:text-blue-400">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}