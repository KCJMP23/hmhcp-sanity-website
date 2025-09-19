'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import type { BulkActionsProps } from './types'

export function BulkActions({ 
  selectedItemsCount, 
  onBulkDelete, 
  onClearSelection 
}: BulkActionsProps) {
  if (selectedItemsCount === 0) return null

  return (
    <Card className="rounded-2xl border-blue-200 bg-blue-50 dark:bg-blue-950/20">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-text text-blue-700 dark:text-blue-300">
            {selectedItemsCount} items selected
          </span>
          <div className="space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onBulkDelete}
              className="rounded-full text-red-600 border-red-200 hover:bg-blue-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onClearSelection}
              className="rounded-full"
            >
              Clear Selection
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}