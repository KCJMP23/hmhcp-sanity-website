'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AlertTriangle, Trash2 } from 'lucide-react'

interface DeleteConfirmationDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title?: string
  description?: string
  isPermanent?: boolean
}

export function DeleteConfirmationDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  title = 'Are you sure?',
  description,
  isPermanent = false
}: DeleteConfirmationDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              {title}
            </div>
          </AlertDialogTitle>
          <AlertDialogDescription>
            {description || (
              isPermanent ? (
                <>
                  This action will <strong className="text-red-600">permanently delete</strong> this item.
                  <br />
                  <span className="text-xs text-red-500 mt-2 block">
                    This action cannot be undone. The item will be permanently removed.
                  </span>
                </>
              ) : (
                <>
                  This item will be moved to the trash.
                  <br />
                  <span className="text-xs text-gray-500 mt-2 block">
                    You can restore this item from the trash later.
                  </span>
                </>
              )
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className={isPermanent ? "bg-red-600 hover:bg-blue-700 text-white" : "bg-yellow-600 hover:bg-blue-700 text-white"}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isPermanent ? 'Delete Permanently' : 'Move to Trash'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}