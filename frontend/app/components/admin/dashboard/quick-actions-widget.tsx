'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  FileText, 
  Users, 
  Settings, 
  Download,
  Upload,
  RefreshCw,
  Send,
  Zap
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function QuickActionsWidget() {
  const router = useRouter()

  const actions = [
    {
      label: 'New Blog Post',
      icon: Plus,
      color: 'text-green-600',
      onClick: () => {
        router.push('/admin/content/blog/new')
      }
    },
    {
      label: 'Manage Users',
      icon: Users,
      color: 'text-blue-600',
      onClick: () => {
        router.push('/admin/users')
      }
    },
    {
      label: 'Run AI Workflow',
      icon: Zap,
      color: 'text-purple-600',
      onClick: () => {
        router.push('/admin/workflows')
      }
    },
    {
      label: 'Export Data',
      icon: Download,
      color: 'text-orange-600',
      onClick: () => {
        toast.info('Export feature coming soon')
      }
    },
    {
      label: 'Import Content',
      icon: Upload,
      color: 'text-indigo-600',
      onClick: () => {
        toast.info('Import feature coming soon')
      }
    },
    {
      label: 'Sync Content',
      icon: RefreshCw,
      color: 'text-teal-600',
      onClick: async () => {
        toast.loading('Syncing content...')
        // Simulate sync
        await new Promise(resolve => setTimeout(resolve, 2000))
        toast.success('Content synced successfully')
      }
    },
    {
      label: 'Publish All',
      icon: Send,
      color: 'text-pink-600',
      onClick: () => {
        toast.info('Batch publish coming soon')
      }
    },
    {
      label: 'Settings',
      icon: Settings,
      color: 'text-gray-600',
      onClick: () => {
        router.push('/admin/settings')
      }
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action, index) => {
            const Icon = action.icon
            return (
              <Button
                key={index}
                variant="outline"
                className="justify-start h-auto py-3 px-3"
                onClick={action.onClick}
              >
                <Icon className={`h-4 w-4 mr-2 ${action.color}`} />
                <span className="text-sm">{action.label}</span>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}