'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Activity, RefreshCw } from 'lucide-react'
import { WebhookLog } from './types'
import { getStatusIcon, getStatusBadge } from './WebhookHelpers'

interface WebhookLogsTabProps {
  logs: WebhookLog[]
  onRefresh: () => void
}

export function WebhookLogsTab({ logs, onRefresh }: WebhookLogsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Recent Activity</h3>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      {logs.length === 0 ? (
        <Card className="p-8 text-center">
          <Activity className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Activity Yet</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Webhook activity will appear here once your webhooks start receiving events.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <Card key={log.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getStatusIcon(log.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{log.event}</span>
                      {getStatusBadge(log.status)}
                      {log.statusCode && (
                        <Badge variant="outline" className="text-xs">
                          {log.statusCode}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <span className="font-mono">{log.url}</span>
                      {log.responseTime && (
                        <span className="ml-4">{log.responseTime}ms</span>
                      )}
                    </div>
                    {log.error && (
                      <div className="text-sm text-red-600 dark:text-blue-400 bg-red-50 dark:bg-blue-900/20 p-2">
                        {log.error}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}