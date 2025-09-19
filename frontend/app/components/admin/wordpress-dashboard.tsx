'use client'

import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/ui/logo'
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarInset,
  SidebarTrigger
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Bell,
  Search,
  Settings,
  User,
  LogOut,
  LayoutDashboard,
  FileText,
  Image,
  Navigation,
  Users,
  BarChart3,
  Globe,
  Plus,
  ChevronDown,
  ChevronRight,
  Menu,
  Building2,
  Stethoscope,
  BookOpen,
  Mail,
  Shield,
  Database,
  Wrench,
  Activity,
  TrendingUp,
  PieChart,
  Presentation,
  Home,
  Bot,
  Zap
} from 'lucide-react'

interface AdminUser {
  id: string
  email?: string
  user_metadata?: {
    role?: string
    full_name?: string
    avatar_url?: string
  }
}

interface WordPressAdminDashboardProps {
  children: ReactNode
  user: AdminUser
  onLogout: () => void
  currentPath: string
}

interface NavItem {
  title: string
  href: string
  icon: any
  badge?: string | number
  children?: NavItem[]
}

const navigationItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Content',
    href: '/admin/content',
    icon: FileText,
    badge: 'New',
    children: [
      { title: 'All Pages', href: '/admin/content', icon: FileText },
      { title: 'Add New Page', href: '/admin/content/new', icon: Plus },
      { title: 'Blog Posts', href: '/admin/content/posts', icon: FileText },
      { title: 'Categories', href: '/admin/content/categories', icon: FileText },
    ]
  },
  {
    title: 'Homepage',
    href: '/admin/homepage',
    icon: Home,
    children: [
      { title: 'Hero Slides', href: '/admin/homepage/hero', icon: Presentation },
    ]
  },
  {
    title: 'Healthcare',
    href: '/admin/healthcare',
    icon: Stethoscope,
    children: [
      { title: 'Clinical Studies', href: '/admin/healthcare/studies', icon: Activity },
      { title: 'Quality Measures', href: '/admin/healthcare/quality', icon: TrendingUp },
      { title: 'Patient Data', href: '/admin/healthcare/patients', icon: Database },
      { title: 'Research Reports', href: '/admin/healthcare/reports', icon: BarChart3 },
    ]
  },
  {
    title: 'Media Library',
    href: '/admin/media',
    icon: Image,
    badge: 47,
  },
  {
    title: 'Platform Management',
    href: '/admin/platforms',
    icon: Building2,
    children: [
      { title: 'IntelliC-EDC', href: '/admin/platforms/intellic-edc', icon: Database },
      { title: 'MyBC Health', href: '/admin/platforms/mybc-health', icon: Activity },
      { title: 'Platform Analytics', href: '/admin/platforms/analytics', icon: PieChart },
    ]
  },
  {
    title: 'Research',
    href: '/admin/research',
    icon: BookOpen,
    children: [
      { title: 'Publications', href: '/admin/research/publications', icon: BookOpen },
      { title: 'Clinical Trials', href: '/admin/research/trials', icon: Activity },
      { title: 'QA/QI Studies', href: '/admin/research/qa-qi', icon: TrendingUp },
    ]
  },
  {
    title: 'User Management',
    href: '/admin/users',
    icon: Users,
    children: [
      { title: 'All Users', href: '/admin/users', icon: Users },
      { title: 'Add New User', href: '/admin/users/new', icon: Plus },
      { title: 'Roles & Permissions', href: '/admin/users/roles', icon: Shield },
    ]
  },
  {
    title: 'Communications',
    href: '/admin/communications',
    icon: Mail,
    children: [
      { title: 'Contact Forms', href: '/admin/communications/forms', icon: Mail },
      { title: 'Newsletter', href: '/admin/communications/newsletter', icon: Mail },
      { title: 'Notifications', href: '/admin/communications/notifications', icon: Bell },
    ]
  },
  {
    title: 'Blog Automation',
    href: '/admin/automation',
    icon: Bot,
    badge: 'AI',
    children: [
      { title: 'Dashboard', href: '/admin/automation', icon: BarChart3 },
      { title: 'Topic Queue', href: '/admin/automation#topics', icon: FileText },
      { title: 'Settings', href: '/admin/automation#settings', icon: Settings },
    ]
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    children: [
      { title: 'Site Traffic', href: '/admin/analytics/traffic', icon: TrendingUp },
      { title: 'User Behavior', href: '/admin/analytics/behavior', icon: Activity },
      { title: 'Content Performance', href: '/admin/analytics/content', icon: PieChart },
    ]
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    children: [
      { title: 'General', href: '/admin/settings/general', icon: Settings },
      { title: 'Navigation', href: '/admin/settings/navigation', icon: Navigation },
      { title: 'SEO', href: '/admin/settings/seo', icon: Globe },
      { title: 'Security', href: '/admin/settings/security', icon: Shield },
      { title: 'Integrations', href: '/admin/settings/integrations', icon: Wrench },
    ]
  },
]

function NavMenuItem({ item, currentPath, depth = 0 }: { item: NavItem; currentPath: string; depth?: number }) {
  const [isOpen, setIsOpen] = useState(
    currentPath.startsWith(item.href) || (item.children?.some(child => currentPath.startsWith(child.href)))
  )
  const isActive = currentPath === item.href
  const hasChildren = item.children && item.children.length > 0

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild={!hasChildren}
        isActive={isActive}
        className={cn(
          "w-full justify-between group hover:bg-primary-50 hover:text-primary-600 transition-colors duration-200",
          depth > 0 && "pl-8 text-sm",
          isActive && "bg-primary-50 text-primary-600 border-r-2 border-primary-600"
        )}
        onClick={hasChildren ? () => setIsOpen(!isOpen) : undefined}
      >
        {hasChildren ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
              {item.badge && (
                <Badge variant="secondary" className="ml-auto bg-primary-100 text-primary-600 text-xs">
                  {item.badge}
                </Badge>
              )}
            </div>
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </div>
        ) : (
          <Link href={item.href} className="flex items-center gap-2 w-full">
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
            {item.badge && (
              <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-600 text-xs">
                {item.badge}
              </Badge>
            )}
          </Link>
        )}
      </SidebarMenuButton>
      
      {hasChildren && isOpen && (
        <div className="ml-2 border-l border-gray-200 pl-2 mt-1">
          {item.children!.map((child) => (
            <NavMenuItem
              key={child.href}
              item={child}
              currentPath={currentPath}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </SidebarMenuItem>
  )
}

export function WordPressAdminDashboard({
  children,
  user,
  onLogout,
  currentPath
}: WordPressAdminDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('')
  
  const userDisplayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin User'
  const userRole = user.user_metadata?.role || 'admin'

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-gray-50">
        {/* WordPress-style Sidebar */}
        <Sidebar className="border-r border-gray-200 bg-white shadow-sm">
          {/* Sidebar Header with Logo */}
          <SidebarHeader className="border-b border-gray-200 p-4">
            <Link href="/" className="flex items-center gap-2">
              <Logo 
                variant="dark"
                width={140}
                height={35}
                priority={true}
                className="h-auto w-auto"
              />
            </Link>
            <div className="text-xs text-gray-500 mt-1">Healthcare Admin Portal</div>
          </SidebarHeader>

          <SidebarContent className="p-2">
            {/* Quick Search */}
            <div className="p-2 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search admin..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-gray-50 border-gray-200 focus:bg-white"
                />
              </div>
            </div>

            {/* Main Navigation */}
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {navigationItems
                    .filter(item => 
                      searchQuery === '' || 
                      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      item.children?.some(child => 
                        child.title.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                    )
                    .map((item) => (
                      <NavMenuItem
                        key={item.href}
                        item={item}
                        currentPath={currentPath}
                      />
                    ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Quick Actions */}
            <SidebarGroup className="mt-6">
              <SidebarGroupLabel className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Quick Actions
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="space-y-2 p-2">
                  <Button size="sm" className="rounded-full w-full justify-start bg-primary-600 hover:bg-primary-700">
                    <Plus className="h-4 w-4 mr-2" />
                    New Page
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-full w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    New Post
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-full w-full justify-start">
                    <Image className="h-4 w-4 mr-2" />
                    Upload Media
                  </Button>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        {/* Main Content Area */}
        <SidebarInset className="flex-1 flex flex-col w-full">
          {/* WordPress-style Top Header */}
          <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden">
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
              
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>HMHCP Admin</span>
                <span>•</span>
                <span className="capitalize">{currentPath.split('/').pop() || 'Dashboard'}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Quick Add Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="rounded-full bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    New
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/admin/content/new">
                      <FileText className="h-4 w-4 mr-2" />
                      Page
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/content/posts/new">
                      <FileText className="h-4 w-4 mr-2" />
                      Blog Post
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/users/new">
                      <User className="h-4 w-4 mr-2" />
                      User
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Notifications */}
              <Button variant="ghost" size="sm" className="rounded-full relative">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500">
                  3
                </Badge>
              </Button>

              {/* View Site */}
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">
                  <Globe className="h-4 w-4 mr-2" />
                  View Site
                </Link>
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="rounded-full flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {userDisplayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-left hidden md:block">
                      <div className="text-sm font-medium">{userDisplayName}</div>
                      <div className="text-xs text-gray-500 capitalize">{userRole}</div>
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{userDisplayName}</p>
                      <p className="text-xs text-gray-500">{user.email || 'No email available'}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/admin/profile">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/settings">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout} className="text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto bg-gray-50 w-full min-h-[calc(100vh-4rem)]">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}