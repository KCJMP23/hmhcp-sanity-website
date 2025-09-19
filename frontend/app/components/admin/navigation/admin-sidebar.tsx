'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight,
  Home,
  Users,
  FileText,
  BarChart3,
  Settings,
  Globe,
  Brain,
  Activity,
  Shield,
  Monitor,
  Sparkles,

  Target,
  PieChart,
  LineChart,
  UserPlus,
  Cog,
  Bell,
  HelpCircle,
  Image,
  Package,
  TestTube,
  GitBranch,
  CheckCircle
} from 'lucide-react';
import { FrostedCard } from '@/components/ui/frosted-card';
import { Typography } from '@/components/ui/apple-typography';
import { Badge } from '@/components/ui/badge';
import NotificationCenter from '@/components/admin/notifications/notification-center';

interface NavigationItem {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  children?: NavigationItem[];
}

const navigationItems: NavigationItem[] = [
  {
    title: 'Dashboard',
    description: 'Overview and key metrics',
    href: '/admin',
    icon: <Home className="h-5 w-5" />
  },
  {
    title: 'AI Generation',
    description: 'AI content creation and templates',
    href: '/admin/ai-generation',
    icon: <Brain className="h-5 w-5" />,
    badge: 'New'
  },
  {
    title: 'Content Management',
    description: 'Manage website content and media',
    href: '/admin/content-management',
    icon: <FileText className="h-5 w-5" />
  },
  {
    title: 'Multi-language',
    description: 'Localization and translations',
    href: '/admin/languages',
    icon: <Globe className="h-5 w-5" />
  },
  {
    title: 'User Management',
    description: 'Users, roles, and permissions',
    href: '/admin/users',
    icon: <Users className="h-5 w-5" />
  },
  {
    title: 'Analytics',
    description: 'Website performance and insights',
    href: '/admin/analytics',
    icon: <BarChart3 className="h-5 w-5" />
  },
  {
    title: 'Performance',
    description: 'System monitoring and optimization',
    href: '/admin/performance',
    icon: <Activity className="h-5 w-5" />
  },
  {
    title: 'Onboarding',
    description: 'User onboarding workflows',
    href: '/admin/onboarding',
    icon: <UserPlus className="h-5 w-5" />
  },
  {
    title: 'Security',
    description: 'Access control and monitoring',
    href: '/admin/security',
    icon: <Shield className="h-5 w-5" />
  },
  {
    title: 'Settings',
    description: 'System configuration',
    href: '/admin/settings',
    icon: <Cog className="h-5 w-5" />
  },
  {
    title: 'Search',
    description: 'Advanced search and discovery',
    href: '/admin/search',
    icon: <Target className="h-5 w-5" />
  },
  {
    title: 'Workflow',
    description: 'Automation and process management',
    href: '/admin/workflow',
    icon: <Sparkles className="h-5 w-5" />
  },
  {
    title: 'Image Optimization',
    description: 'Image compression and optimization',
    href: '/admin/performance/image-optimization',
    icon: <Image className="h-5 w-5" />
  },
  {
    title: 'Bundle Analysis',
    description: 'JavaScript bundle optimization',
    href: '/admin/performance/bundle-analysis',
    icon: <Package className="h-5 w-5" />
  },
  {
    title: 'Testing',
    description: 'Test suite management and monitoring',
    href: '/admin/testing',
    icon: <TestTube className="h-5 w-5" />
  },
  {
    title: 'Advanced Analytics',
    description: 'AI-powered insights and user behavior',
    href: '/admin/analytics/advanced',
    icon: <Brain className="h-5 w-5" />
  },
  {
    title: 'A/B Testing',
    description: 'Experiment optimization and testing',
    href: '/admin/analytics/ab-testing',
    icon: <TestTube className="h-5 w-5" />
  },
  {
    title: 'Deployment',
    description: 'CI/CD pipeline and deployment management',
    href: '/admin/deployment',
    icon: <GitBranch className="h-5 w-5" />
  },
  {
    title: 'Threat Detection',
    description: 'AI-powered security monitoring',
    href: '/admin/security/threat-detection',
    icon: <Shield className="h-5 w-5" />
  },
  {
    title: 'Compliance',
    description: 'HIPAA, GDPR, and regulatory compliance',
    href: '/admin/security/compliance',
    icon: <CheckCircle className="h-5 w-5" />
  }
];

export default function AdminSidebar({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <motion.div
        initial={{ width: 320 }}
        animate={{ width: isCollapsed ? 80 : 320 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="relative bg-white shadow-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                key="title"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Typography variant="heading3" className="text-gray-900">
                  Admin Panel
                </Typography>
                <Typography variant="small" className="text-gray-600">
                  HMHCP Website
                </Typography>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button
            onClick={toggleCollapse}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navigationItems.map((item, index) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <Link href={item.href}>
                <motion.div
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`group relative p-3 rounded-2xl transition-all duration-200 cursor-pointer ${
                    isActive(item.href)
                      ? 'bg-blue-50 border border-blue-200 shadow-sm'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-xl transition-colors ${
                      isActive(item.href)
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600'
                    }`}>
                      {item.icon}
                    </div>
                    
                    <AnimatePresence mode="wait">
                      {!isCollapsed && (
                        <motion.div
                          key="content"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                          className="flex-1 min-w-0"
                        >
                          <div className="flex items-center space-x-2">
                            <Typography variant="label" className={`font-medium ${
                              isActive(item.href) ? 'text-blue-900' : 'text-gray-900'
                            }`}>
                              {item.title}
                            </Typography>
                            {item.badge && (
                              <Badge variant="default" className="text-xs">
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                          <Typography variant="small" className={`truncate ${
                            isActive(item.href) ? 'text-blue-700' : 'text-gray-600'
                          }`}>
                            {item.description}
                          </Typography>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Active indicator */}
                  {isActive(item.href) && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                key="footer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <NotificationCenter />
                
                <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="p-2 rounded-lg bg-gray-200 text-gray-600">
                    <HelpCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <Typography variant="small" className="text-gray-900 font-medium">
                      Help & Support
                    </Typography>
                    <Typography variant="small" className="text-gray-600">
                      Documentation
                    </Typography>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
}

