'use client'

import { AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface ArchiveNoticeProps {
  message?: string
  showHomeButton?: boolean
}

export function ArchiveNotice({ 
  message = 'This page is currently being updated and will be restored soon.',
  showHomeButton = true
}: ArchiveNoticeProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white dark:bg-gray-800 rounded-full shadow-lg p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-yellow-100 dark:bg-blue-900/30 p-4 rounded-lg">
              <AlertCircle className="h-12 w-12 text-yellow-600 dark:text-blue-500" />
            </div>
          </div>
          
          <h1 className="text-3xl font-display font-light text-gray-900 dark:text-white mb-4 tracking-tight">
            Page Under Construction
          </h1>
          
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            {message}
          </p>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              We apologize for any inconvenience. This content will be available again soon.
            </p>
            
            {showHomeButton && (
              <div className="flex gap-4 justify-center">
                <Link href="/">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    Return to Home
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="outline">
                    Contact Us
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Status: <span className="font-medium text-yellow-600 dark:text-blue-500">Archive/Draft</span>
          </p>
        </div>
      </div>
    </div>
  )
}