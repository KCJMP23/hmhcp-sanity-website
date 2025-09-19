'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart3, 
  Mail, 
  Puzzle, 
  Workflow, 
  Settings, 
  Users, 
  FileText,
  Database,
  Shield,
  Monitor,
  ChevronDown,
  ChevronRight,
  Upload
} from 'lucide-react';
import { AdminRole } from '@/lib/dal/admin/types';

interface AdminSidebarProps {
  userRole: AdminRole | null;
}

interface MenuItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: MenuItem[];
  roles?: AdminRole[];
}

const menuItems: MenuItem[] = [
  {
    title: 'Analytics Studio',
    href: '/admin/analytics-studio',
    icon: BarChart3,
    children: [
      { title: 'Dashboard', href: '/admin/analytics-studio', icon: BarChart3 },
      { title: 'Data Sources', href: '/admin/analytics-studio/data-sources', icon: Database },
      { title: 'Healthcare', href: '/admin/analytics-studio/healthcare', icon: Shield },
      { title: 'Performance', href: '/admin/analytics-studio/performance', icon: Monitor },
    ]
  },
  {
    title: 'Email Marketing',
    href: '/admin/email',
    icon: Mail,
    children: [
      { title: 'Campaigns', href: '/admin/email/campaigns', icon: Mail },
      { title: 'Contacts', href: '/admin/email/contacts', icon: Users },
      { title: 'Analytics', href: '/admin/email/analytics', icon: BarChart3 },
      { title: 'Automations', href: '/admin/email/automations', icon: Workflow },
    ]
  },
  {
    title: 'Content Management',
    href: '/admin/content',
    icon: FileText,
    children: [
      { title: 'Pages', href: '/admin/content/pages', icon: FileText },
      { title: 'Platforms', href: '/admin/content/platforms', icon: Database },
    ]
  },
  {
    title: 'Plugins',
    href: '/admin/plugins',
    icon: Puzzle,
    children: [
      { title: 'Marketplace', href: '/admin/plugins/marketplace', icon: Puzzle },
      { title: 'Upload', href: '/admin/plugins/upload', icon: Upload },
      { title: 'Configure', href: '/admin/plugins/configure', icon: Settings },
    ]
  },
  {
    title: 'Workflows',
    href: '/admin/workflows',
    icon: Workflow,
    children: [
      { title: 'Builder', href: '/admin/workflows/builder', icon: Workflow },
    ]
  },
];

export default function AdminSidebar({ userRole }: AdminSidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const isItemActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const canAccessItem = (item: MenuItem) => {
    if (!item.roles) return true;
    return userRole && item.roles.includes(userRole);
  };

  return (
    <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          if (!canAccessItem(item)) return null;

          const isExpanded = expandedItems.includes(item.title);
          const hasChildren = item.children && item.children.length > 0;

          return (
            <div key={item.title}>
              <div
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                  isItemActive(item.href) 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => hasChildren ? toggleExpanded(item.title) : null}
              >
                <Link 
                  href={item.href} 
                  className="flex items-center space-x-3 flex-1"
                  onClick={(e) => hasChildren && e.preventDefault()}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.title}</span>
                </Link>
                {hasChildren && (
                  <button className="p-1">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>

              {hasChildren && isExpanded && (
                <div className="ml-6 space-y-1 mt-2">
                  {item.children!.map((child) => {
                    if (!canAccessItem(child)) return null;
                    
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                          isItemActive(child.href)
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <child.icon className="w-4 h-4" />
                        <span className="text-sm">{child.title}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
