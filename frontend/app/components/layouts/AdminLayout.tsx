'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  BarChart3,
  Monitor,
  Package,
  Menu,
  X,
  LogOut,
  Bell,
  Search,
  ChevronDown,
  Shield,
  Database,
  Zap,
  Globe,
  Mail,
  Activity
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

interface AdminLayoutProps {
  children: React.ReactNode
}

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  subitems?: NavItem[]
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Content',
    href: '/admin/content',
    icon: FileText,
    subitems: [
      { title: 'Pages', href: '/admin/content', icon: FileText },
      { title: 'Blog Posts', href: '/admin/blog', icon: FileText },
      { title: 'Media', href: '/admin/media', icon: Package },
    ]
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    badge: 'New',
    subitems: [
      { title: 'Traffic', href: '/admin/analytics/traffic', icon: BarChart3 },
      { title: 'Behavior', href: '/admin/analytics/behavior', icon: Activity },
      { title: 'Content', href: '/admin/analytics/content', icon: FileText },
    ]
  },
  {
    title: 'Monitoring',
    href: '/admin/monitoring',
    icon: Monitor,
    badge: 3,
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    subitems: [
      { title: 'General', href: '/admin/settings/general', icon: Settings },
      { title: 'Security', href: '/admin/settings/security', icon: Shield },
      { title: 'Database', href: '/admin/settings/database', icon: Database },
      { title: 'Email', href: '/admin/settings/email', icon: Mail },
      { title: 'SEO', href: '/admin/settings/seo', icon: Globe },
    ]
  },
]

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true)
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    )
  }

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  const renderNavItem = (item: NavItem, isNested = false) => {
    const hasSubitems = item.subitems && item.subitems.length > 0
    const isExpanded = expandedItems.includes(item.title)
    const active = isActive(item.href)
    const Icon = item.icon

    return (
      <div key={item.href}>
        <Link
          href={item.href}
          onClick={(e) => {
            if (hasSubitems) {
              e.preventDefault()
              toggleExpanded(item.title)
            }
          }}
          className={cn(
            'flex items-center gap-3  px-3 py-2 text-sm transition-all hover:bg-accent',
            active && 'bg-accent text-accent-foreground',
            isNested && 'ml-6'
          )}
        >
          <Icon className="h-4 w-4" />
          <span className="flex-1">{item.title}</span>
          {item.badge && (
            <Badge variant={typeof item.badge === 'number' ? 'destructive' : 'default'} className="ml-auto">
              {item.badge}
            </Badge>
          )}
          {hasSubitems && (
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform',
                isExpanded && 'rotate-180'
              )}
            />
          )}
        </Link>
        {hasSubitems && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.subitems!.map(subitem => renderNavItem(subitem, true))}
          </div>
        )}
      </div>
    )
  }

  const SidebarContent = () => (
    <>
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/admin" className="flex items-center gap-2 font-semibold">
          <Shield className="h-6 w-6" />
          <span>Admin Panel</span>
        </Link>
        <Button
          variant="outline"
          size="icon"
          className="ml-auto h-8 w-8 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close sidebar</span>
        </Button>
      </div>
      <div className="flex-1 px-3 py-4 overflow-y-auto">
        <nav className="space-y-2">
          {navItems.map(item => renderNavItem(item))}
        </nav>
      </div>
    </>
  )

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden lg:block lg:border-r lg:bg-gray-50/40 dark:lg:bg-gray-950/40 transition-all duration-300",
        desktopSidebarOpen ? "lg:w-64" : "lg:w-0"
      )}>
        <div className="w-64">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="flex h-14 items-center gap-4 border-b bg-gray-50/40 px-4 dark:bg-gray-950/40 lg:h-[60px] lg:px-6">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
          
          {/* Desktop Sidebar Toggle */}
          <Button
            variant="outline"
            size="icon"
            className="hidden lg:flex h-8 w-8"
            onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)}
          >
            <Menu className="h-4 w-4" />
            <span className="sr-only">Toggle desktop sidebar</span>
          </Button>

          {/* Search */}
          <div className="w-full flex-1">
            <form>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search..."
                  className="w-full border border-input bg-background px-8 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:w-[300px] lg:w-[400px]"
                />
              </div>
            </form>
          </div>

          {/* Header Actions */}
          <Button variant="outline" size="icon" className="h-8 w-8">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Notifications</span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/avatars/admin.png" alt="Admin" />
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Admin User</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    admin@example.com
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Users className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}