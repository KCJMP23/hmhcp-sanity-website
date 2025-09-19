'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RotateCcw as ArrowPathIcon,
  Bell as BellIcon,
  BookOpen as BookOpenIcon,
  BarChart3 as ChartBarIcon,
  PieChart as ChartPieIcon,
  MessageCircle as ChatBubbleLeftIcon,
  CheckCircle as CheckCircleIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Clock as ClockIcon,
  CloudUpload as CloudArrowUpIcon,
  Code as CodeBracketIcon,
  Settings as CogIcon,
  Package as CubeIcon,
  Copy as DocumentDuplicateIcon,
  FileText as DocumentTextIcon,
  Eye as EyeIcon,
  Folder as FolderIcon,
  Globe as GlobeAltIcon,
  Home as HomeIcon,
  Link as LinkIcon,
  Monitor as ComputerDesktopIcon,
  Moon as MoonIcon,
  Newspaper as NewspaperIcon,
  Edit as PencilIcon,
  Image as PhotoIcon,
  ShieldCheck as ShieldCheckIcon,
  Sun as SunIcon,
  Tag as TagIcon,
  Users as UserGroupIcon,
  User as UserIcon,
  Wrench as WrenchScrewdriverIcon,
  Activity as ChartBarSquareIcon,
} from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  children?: MenuItem[]
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    href: '/admin',
    icon: HomeIcon,
  },
  {
    id: 'content',
    name: 'Content',
    href: '/admin/content',
    icon: DocumentTextIcon,
    children: [
      { id: 'pages', name: 'All Pages', href: '/admin/content', icon: DocumentTextIcon },
      { id: 'add-page', name: 'Add New Page', href: '/admin/content/new', icon: PencilIcon },
      { id: 'blog-posts', name: 'Blog Posts', href: '/admin/blog', icon: DocumentTextIcon },
      { id: 'drafts', name: 'Drafts', href: '/admin/content/drafts', icon: DocumentDuplicateIcon, badge: 3 },
      { id: 'published', name: 'Published', href: '/admin/content/published', icon: EyeIcon },
    ],
  },
  {
    id: 'posts',
    name: 'Posts',
    href: '/admin/posts',
    icon: NewspaperIcon,
    children: [
      { id: 'all-posts', name: 'All Posts', href: '/admin/posts', icon: NewspaperIcon },
      { id: 'add-post', name: 'Add New Post', href: '/admin/posts/new', icon: PencilIcon },
      { id: 'categories', name: 'Categories', href: '/admin/posts/categories', icon: FolderIcon },
      { id: 'tags', name: 'Tags', href: '/admin/posts/tags', icon: TagIcon },
    ],
  },
  {
    id: 'media',
    name: 'Media',
    href: '/admin/media',
    icon: PhotoIcon,
    children: [
      { id: 'all-media', name: 'All Media', href: '/admin/media', icon: PhotoIcon },
      { id: 'upload', name: 'Upload New', href: '/admin/media/upload', icon: CloudArrowUpIcon },
      { id: 'gallery', name: 'Gallery', href: '/admin/media/gallery', icon: CubeIcon },
    ],
  },
  {
    id: 'users',
    name: 'Users',
    href: '/admin/users',
    icon: UserGroupIcon,
    children: [
      { id: 'all-users', name: 'All Users', href: '/admin/users', icon: UserGroupIcon },
      { id: 'add-user', name: 'Add New User', href: '/admin/users/new', icon: UserIcon },
      { id: 'profile', name: 'Your Profile', href: '/admin/users/profile', icon: UserIcon },
    ],
  },
  {
    id: 'comments',
    name: 'Comments',
    href: '/admin/comments',
    icon: ChatBubbleLeftIcon,
    badge: 12,
  },
  {
    id: 'workflow',
    name: 'Workflow',
    href: '/admin/workflow',
    icon: ArrowPathIcon,
    badge: 8,
    children: [
      { id: 'workflow-overview', name: 'Overview', href: '/admin/workflow', icon: ChartPieIcon },
      { id: 'workflow-instances', name: 'All Workflows', href: '/admin/workflow/instances', icon: ArrowPathIcon },
      { id: 'workflow-reviews', name: 'My Reviews', href: '/admin/workflow/reviews', icon: CheckCircleIcon, badge: 5 },
      { id: 'workflow-scheduled', name: 'Scheduled', href: '/admin/workflow/scheduled', icon: ClockIcon },
      { id: 'workflow-templates', name: 'Templates', href: '/admin/workflow/templates', icon: DocumentDuplicateIcon },
      { id: 'workflow-analytics', name: 'Analytics', href: '/admin/workflow/analytics', icon: ChartBarIcon },
    ],
  },
  {
    id: 'analytics',
    name: 'Analytics',
    href: '/admin/analytics',
    icon: ChartBarIcon,
    children: [
      { id: 'overview', name: 'Overview', href: '/admin/analytics', icon: ChartPieIcon },
      { id: 'reports', name: 'Reports', href: '/admin/analytics/reports', icon: ChartBarIcon },
      { id: 'realtime', name: 'Real-time', href: '/admin/analytics/realtime', icon: GlobeAltIcon },
    ],
  },
  {
    id: 'performance',
    name: 'Performance',
    href: '/admin/performance',
    icon: ChartBarIcon,
    badge: 3,
    children: [
      { id: 'performance-monitoring', name: 'Monitoring', href: '/admin/performance', icon: ChartPieIcon },
      { id: 'system-monitoring', name: 'System Status', href: '/admin/monitoring/dashboard', icon: ComputerDesktopIcon },
      { id: 'diagnostic', name: 'Diagnostics', href: '/admin/diagnostic', icon: ChartBarSquareIcon },
    ],
  },
  {
    id: 'seo',
    name: 'SEO & Performance',
    href: '/admin/seo',
    icon: GlobeAltIcon,
    badge: 1,
    children: [
      { id: 'seo-dashboard', name: 'SEO Dashboard', href: '/admin/seo', icon: ChartBarIcon },
      { id: 'seo-settings', name: 'SEO Settings', href: '/admin/settings/seo', icon: CogIcon },
    ],
  },
  {
    id: 'make',
    name: 'Make.com',
    href: '/admin/make',
    icon: LinkIcon,
    children: [
      { id: 'integrations', name: 'Integrations', href: '/admin/make', icon: LinkIcon },
      { id: 'webhooks', name: 'Webhooks', href: '/admin/make/webhooks', icon: CodeBracketIcon },
      { id: 'logs', name: 'Activity Logs', href: '/admin/make/logs', icon: DocumentTextIcon },
      { id: 'api-keys', name: 'API Keys', href: '/admin/make/api-keys', icon: ShieldCheckIcon },
    ],
  },
  {
    id: 'ai-automation',
    name: 'AI Automation',
    href: '/admin/ai-automation',
    icon: WrenchScrewdriverIcon,
    children: [
      { id: 'automation-overview', name: 'Dashboard', href: '/admin/ai-automation', icon: ChartPieIcon },
      { id: 'workflow-builder', name: 'Workflows', href: '/admin/ai-automation/workflows', icon: ArrowPathIcon },
      { id: 'execution-monitor', name: 'Executions', href: '/admin/ai-automation/executions', icon: ChartBarSquareIcon },
      { id: 'agent-monitor', name: 'AI Agents', href: '/admin/ai-automation/agents', icon: WrenchScrewdriverIcon },
      { id: 'compliance-monitor', name: 'Compliance', href: '/admin/ai-automation/compliance', icon: ShieldCheckIcon },
      { id: 'alert-system', name: 'Alerts', href: '/admin/ai-automation/alerts', icon: BellIcon },
    ],
  },
  {
    id: 'agents',
    name: 'AI Agents (Legacy)',
    href: '/admin/agents',
    icon: WrenchScrewdriverIcon,
    children: [
      { id: 'agents-overview', name: 'Overview', href: '/admin/agents', icon: WrenchScrewdriverIcon },
      { id: 'agents-chat', name: 'Authoring (Chat)', href: '/admin/agents/chat', icon: PencilIcon },
    ],
  },
  {
    id: 'settings',
    name: 'Settings',
    href: '/admin/settings',
    icon: CogIcon,
    children: [
      { id: 'general', name: 'General', href: '/admin/settings', icon: CogIcon },
      { id: 'writing', name: 'Writing', href: '/admin/settings/writing', icon: PencilIcon },
      { id: 'reading', name: 'Reading', href: '/admin/settings/reading', icon: BookOpenIcon },
      { id: 'discussion', name: 'Discussion', href: '/admin/settings/discussion', icon: ChatBubbleLeftIcon },
      { id: 'media-settings', name: 'Media', href: '/admin/settings/media', icon: PhotoIcon },
      { id: 'permalinks', name: 'Permalinks', href: '/admin/settings/permalinks', icon: GlobeAltIcon },
      { id: 'privacy', name: 'Privacy', href: '/admin/settings/privacy', icon: ShieldCheckIcon },
    ],
  },
]

interface CollapsibleAdminSidebarProps {
  className?: string
}

export default function DashboardSidebarCollapsible({ 
  className = '' 
}: CollapsibleAdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin-sidebar-collapsed') === 'true'
    }
    return false
  })
  
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [notifications] = useState(5)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('admin-theme') as 'light' | 'dark' | null
      if (stored === 'light' || stored === 'dark') return stored
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      return prefersDark ? 'dark' : 'light'
    }
    return 'light'
  })
  const pathname = usePathname()

  useEffect(() => {
    const saved = typeof window !== 'undefined' && localStorage.getItem('admin-sidebar-collapsed') === 'true'
    setIsCollapsed(saved)
    document.documentElement.setAttribute('data-admin-collapsed', saved ? 'true' : 'false')
    // Ensure CSS var is applied immediately on mount for deterministic width
    try {
      document.documentElement.style.setProperty('--admin-sidebar-width', saved ? '4rem' : '16rem')
    } catch (_) {}

    // Apply theme immediately on mount
    try {
      const storedTheme = (localStorage.getItem('admin-theme') as 'light' | 'dark' | null) || theme
      document.documentElement.classList.toggle('dark', storedTheme === 'dark')
    } catch (_) {}

    // Auto-expand active menu item
    const activeItem = menuItems.find(item => 
      isActiveMenuItem(item.href, pathname) || 
      item.children?.some(child => isActiveMenuItem(child.href, pathname))
    )
    if (activeItem && activeItem.children) {
      setExpandedItems(prev => new Set(prev).add(activeItem.id))
    }
  }, [pathname])

  // Keep theme in sync when toggled
  useEffect(() => {
    try {
      document.documentElement.classList.toggle('dark', theme === 'dark')
      localStorage.setItem('admin-theme', theme)
      window.dispatchEvent(new CustomEvent('admin-theme-changed', { detail: { theme } }))
    } catch (_) {}
  }, [theme])

  const toggleCollapse = () => {
    const newCollapsed = !isCollapsed
    setIsCollapsed(newCollapsed)
    localStorage.setItem('admin-sidebar-collapsed', newCollapsed.toString())

    // Immediately apply deterministic width so content never lags
    document.documentElement.setAttribute('data-admin-collapsed', newCollapsed ? 'true' : 'false')
    try {
      document.documentElement.style.setProperty('--admin-sidebar-width', newCollapsed ? '4rem' : '16rem')
    } catch (_) {}

    // Dispatch custom event for cross-component communication
    window.dispatchEvent(new CustomEvent('sidebar-collapsed-changed', { detail: { collapsed: newCollapsed } }))
    if (newCollapsed) {
      setExpandedItems(new Set())
    }
  }

  // Close mobile menu when a link is clicked (on small screens)
  const closeMobileIfNeeded = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches) {
      document.documentElement.setAttribute('data-admin-mobile-open', 'false')
    }
  }

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const isActiveMenuItem = (href: string, pathname: string): boolean => {
    return pathname === href || (href !== '/admin' && pathname.startsWith(href + '/'))
  }

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const isActive = isActiveMenuItem(item.href, pathname)
    const isExpanded = expandedItems.has(item.id)
    const hasChildren = item.children && item.children.length > 0
    const isChildActive = hasChildren && item.children!.some(child => isActiveMenuItem(child.href, pathname))

    return (
      <div key={item.id} className="relative">
        <Link
          href={item.href}
          className={`
            group relative flex items-center justify-between w-full py-2 text-xs font-medium transition-all duration-200 tracking-tight
            ${level === 0 ? 'pl-3 pr-2' : 'pl-6 pr-2'}
            ${isActive 
              ? 'bg-gray-800 text-white' 
              : isChildActive
                ? 'bg-gray-900 text-gray-100'
                : 'text-gray-300 hover:bg-gray-800 hover:text-gray-100'
            }
            ${isCollapsed && level === 0 ? 'justify-center px-2' : ''}
          `}
          onClick={(e) => {
            if (hasChildren && !isCollapsed) {
              e.preventDefault()
              toggleExpanded(item.id)
            }
            closeMobileIfNeeded()
          }}
        >
          <div className="flex items-center min-w-0 flex-1">
            <item.icon className={`
              flex-shrink-0 transition-colors duration-200
              ${isCollapsed ? 'w-6 h-6' : 'w-4 h-4 mr-2.5'}
              ${isActive 
                ? 'text-gray-200' 
                : 'text-gray-400 group-hover:text-gray-200'
              }
            `} />
            
            {!isCollapsed && (
              <>
                <span className="truncate menu-label">{item.name}</span>
                {item.badge && (
                  <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full badge-label">
                    {item.badge}
                  </span>
                )}
              </>
            )}

            {isCollapsed && (
              <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-gray-950 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                {item.name}
                {item.badge && (
                  <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-red-600 rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
            )}
          </div>
          
          {!isCollapsed && hasChildren && (
            <ChevronRightIcon className={`
              w-4 h-4 transition-transform duration-200 flex-shrink-0
              ${isExpanded ? 'rotate-90' : ''}
              ${isActive ? 'text-gray-200' : 'text-gray-500'}
            `} />
          )}
        </Link>

        {/* Children */}
        <AnimatePresence initial={false}>
          {!isCollapsed && hasChildren && isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="py-1">
                {item.children?.map(child => renderMenuItem(child, level + 1))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div
      className={`
        admin-sidebar relative bg-gray-950 text-gray-100 border-r border-gray-900 transition-all duration-300 ease-in-out flex flex-col h-full
        ${className}
      `}
      style={{ width: 'var(--admin-sidebar-width, 16rem)' }}
    >
      {/* Hard background layer to guarantee dark column regardless of parent stacking */}
      <div className="absolute inset-0 bg-gray-950 pointer-events-none select-none z-0" aria-hidden="true" />
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-3 border-b border-gray-800">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <div>
              <h2 className="text-xs font-semibold text-white">Dashboard</h2>
              <p className="text-[11px] text-gray-400">Admin Panel</p>
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))}
            className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors duration-200"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle color theme"
          >
            {theme === 'dark' ? (
              <SunIcon className="w-4 h-4 text-gray-300" />
            ) : (
              <MoonIcon className="w-4 h-4 text-gray-300" />
            )}
          </button>
          <button
            onClick={toggleCollapse}
            className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors duration-200"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRightIcon className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronLeftIcon className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden py-2 space-y-0.5">
        {menuItems.map(item => renderMenuItem(item))}
      </nav>

      {/* Footer */}
      <div className="relative z-10 border-t border-gray-800 p-3">
        {!isCollapsed ? (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Admin User</p>
              <p className="text-xs text-gray-400 truncate">admin@example.com</p>
            </div>
            {notifications > 0 && (
              <div className="relative">
                <BellIcon className="w-5 h-5 text-gray-400" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">{notifications}</span>
                </span>
              </div>
            )}
            <button
              onClick={async () => {
                try {
                  await fetch('/api/admin/auth/logout', { method: 'POST', credentials: 'include' })
                } catch (_) {}
                window.location.href = '/admin/login'
              }}
              className="ml-2 px-2 py-1.5 text-xs rounded-md bg-gray-800 hover:bg-gray-700 text-gray-200"
              title="Logout"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-white" />
              </div>
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">{notifications}</span>
                </span>
              )}
              <button
                onClick={async () => {
                  try { await fetch('/api/admin/auth/logout', { method: 'POST', credentials: 'include' }) } catch (_) {}
                  window.location.href = '/admin/login'
                }}
                className="absolute -right-10 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md bg-gray-800/80 hover:bg-gray-700 text-gray-200 flex items-center justify-center"
                title="Logout"
              >
                ⎋
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}