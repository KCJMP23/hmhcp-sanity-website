'use client'

import { AlertCircle, Edit, Eye, Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

interface ArchiveNoticeAdminProps {
  message?: string
  showHomeButton?: boolean
  pageType?: 'page' | 'post'
}

export function ArchiveNoticeAdmin({ 
  message = 'This page is currently being updated and will be restored soon.',
  showHomeButton = true,
  pageType = 'page'
}: ArchiveNoticeAdminProps) {
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState(false)
  
  useEffect(() => {
    // Check if user is logged in as admin
    const checkAdminStatus = async () => {
      try {
        const response = await fetch('/api/auth/check-admin')
        const data = await response.json()
        setIsAdmin(data.isAdmin || false)
      } catch {
        setIsAdmin(false)
      }
    }
    
    checkAdminStatus()
  }, [])

  // Extract page slug from pathname
  const pageName = pathname.split('/').pop() || 'page'
  const editUrl = pageType === 'post' 
    ? `/admin/blog/edit/${pageName}` 
    : `/admin/content/edit/${pageName}`

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
          
          {isAdmin && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-full p-4 mb-6">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-3">
                Admin Options:
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Link href={editUrl}>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Page
                  </Button>
                </Link>
                <Link href={`${editUrl}?preview=true`}>
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </Link>
                <Link href="/admin/content/wordpress-style">
                  <Button size="sm" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Content
                  </Button>
                </Link>
              </div>
            </div>
          )}
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {isAdmin 
                ? 'As an admin, you can edit this page using the options above.'
                : 'We apologize for any inconvenience. This content will be available again soon.'
              }
            </p>
            
            {showHomeButton && (
              <div className="flex gap-4 justify-center">
                <Link href="/">
                  <Button className="bg-gray-600 hover:bg-gray-700 text-white">
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
            {isAdmin && (
              <span className="ml-2 text-blue-600 dark:text-blue-400">
                (Admin View)
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}