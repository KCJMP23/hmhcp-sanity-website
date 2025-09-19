'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut, User, Menu } from 'lucide-react'

interface AdminHeaderProps {
  onMenuClick: () => void
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const router = useRouter()

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="p-2 rounded-md lg:hidden hover:bg-gray-100 transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="ml-2 text-lg sm:text-xl font-semibold text-gray-900">Admin Dashboard</h1>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
              <User className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">Admin User</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/')}
            >
              <LogOut className="h-4 w-4 mr-0 sm:mr-2" />
              <span className="hidden sm:inline">Exit Admin</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}