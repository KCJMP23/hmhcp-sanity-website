import { Eye, AlertCircle, TrendingUp, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TabType } from '../types'

interface TabNavigationProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

const tabs = [
  { id: 'overview' as const, label: 'Overview', icon: Eye },
  { id: 'issues' as const, label: 'Issues', icon: AlertCircle },
  { id: 'recommendations' as const, label: 'Recommendations', icon: TrendingUp },
  { id: 'metrics' as const, label: 'Metrics', icon: FileText },
]

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <nav className="flex space-x-8">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors',
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}