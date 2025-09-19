'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  FileText,
  BookOpen,
  Edit,
  Database,
  Users,
  Shield,
  Search,
  Mail,
  HardDrive
} from 'lucide-react'
import type { QuickActionsProps } from './types'

export function QuickActions({}: QuickActionsProps) {
  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2 overflow-x-hidden">
      {/* Content Actions */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl text-foreground">Content Management</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">Create and manage your website content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-2 overflow-x-hidden">
            <Button variant="outline" className="rounded-full h-14 sm:h-16 flex flex-col justify-center items-center gap-1 sm:gap-2 px-2 sm:px-4" asChild>
              <Link href="/admin/pages/new">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-xs sm:text-sm">New Page</span>
              </Link>
            </Button>
            <Button variant="outline" className="rounded-full h-14 sm:h-16 flex flex-col justify-center items-center gap-1 sm:gap-2 px-2 sm:px-4" asChild>
              <Link href="/admin/content/posts/new">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-xs sm:text-sm">New Post</span>
              </Link>
            </Button>
            <Button variant="outline" className="rounded-full h-14 sm:h-16 flex flex-col justify-center items-center gap-1 sm:gap-2 px-2 sm:px-4" asChild>
              <Link href="/admin/content">
                <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-xs sm:text-sm">Edit Pages</span>
              </Link>
            </Button>
            <Button variant="outline" className="rounded-full h-14 sm:h-16 flex flex-col justify-center items-center gap-1 sm:gap-2 px-2 sm:px-4" asChild>
              <Link href="/admin/blog">
                <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-xs sm:text-sm">Edit Posts</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Media & Settings */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl text-foreground">Media & Settings</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">Upload files and configure your site</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 overflow-x-hidden">
            <Button variant="outline" className="rounded-full h-14 sm:h-16 flex flex-col justify-center items-center gap-1 sm:gap-2 px-2 sm:px-4" asChild>
              <Link href="/admin/media">
                <Database className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-xs sm:text-sm">Media</span>
              </Link>
            </Button>
            <Button variant="outline" className="rounded-full h-14 sm:h-16 flex flex-col justify-center items-center gap-1 sm:gap-2 px-2 sm:px-4" asChild>
              <Link href="/admin/users">
                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-xs sm:text-sm">Users</span>
              </Link>
            </Button>
            <Button variant="outline" className="rounded-full h-14 sm:h-16 flex flex-col justify-center items-center gap-1 sm:gap-2 px-2 sm:px-4" asChild>
              <Link href="/admin/settings">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-xs sm:text-sm">Settings</span>
              </Link>
            </Button>
            <Button variant="outline" className="rounded-full h-14 sm:h-16 flex flex-col justify-center items-center gap-1 sm:gap-2 px-2 sm:px-4" asChild>
              <Link href="/admin/settings/seo">
                <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-xs sm:text-sm">SEO</span>
              </Link>
            </Button>
            <Button variant="outline" className="rounded-full h-14 sm:h-16 flex flex-col justify-center items-center gap-1 sm:gap-2 px-2 sm:px-4" asChild>
              <Link href="/admin/email">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-xs sm:text-sm">Email</span>
              </Link>
            </Button>
            <Button variant="outline" className="rounded-full h-14 sm:h-16 flex flex-col justify-center items-center gap-1 sm:gap-2 px-2 sm:px-4" asChild>
              <Link href="/admin/backup">
                <HardDrive className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-xs sm:text-sm">Backup</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}