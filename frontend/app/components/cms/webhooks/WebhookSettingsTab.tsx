'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Zap } from 'lucide-react'

export function WebhookSettingsTab() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="font-medium mb-4">Global Webhook Settings</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="defaultTimeout">Default Timeout (seconds)</Label>
              <Input
                id="defaultTimeout"
                type="number"
                defaultValue="30"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="defaultRetries">Default Retry Attempts</Label>
              <Input
                id="defaultRetries"
                type="number"
                defaultValue="3"
                className="mt-1"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch id="enableWebhooks" defaultChecked />
            <Label htmlFor="enableWebhooks">Enable webhooks globally</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch id="enableLogging" defaultChecked />
            <Label htmlFor="enableLogging">Enable webhook logging</Label>
          </div>
        </div>
      </Card>
      
      <Card className="p-6">
        <h3 className="font-medium mb-4">Integration Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-blue-500" />
              <span className="font-medium">Make.com</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Automate workflows with Make.com's visual scenario builder.
            </p>
            <Button variant="outline" size="sm">
              Get Template
            </Button>
          </div>
          
          <div className="border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-blue-500" />
              <span className="font-medium">Zapier</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Connect with 5000+ apps using Zapier's automation platform.
            </p>
            <Button variant="outline" size="sm">
              Get Template
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}