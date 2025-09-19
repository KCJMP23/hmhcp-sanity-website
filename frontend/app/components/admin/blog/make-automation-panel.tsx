'use client'

import React, { useState } from 'react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Webhook, 
  Zap, 
  Share2, 
  Settings, 
  Play, 
  Pause, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface MakeAutomationPanelProps {
  blogPost?: {
    id: string
    title: string
    status: string
    publishedAt?: string
    socialMedia?: any
    aiGenerated?: boolean
    automationMetadata?: any
  }
}

export function MakeAutomationPanel({ blogPost }: MakeAutomationPanelProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [automationStatus, setAutomationStatus] = useState('idle')
  const [lastTrigger, setLastTrigger] = useState<Date | null>(null)
  const [webhookStatus, setWebhookStatus] = useState({
    makeWebhook: 'unknown',
    socialMediaWebhook: 'unknown',
    n8nWebhook: 'unknown'
  })

  const handleTriggerSocialMedia = async () => {
    if (!blogPost) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/webhooks/social-media/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: blogPost.id,
          platforms: ['instagram', 'facebook', 'twitter', 'linkedin']
        })
      })

      const result = await response.json()
      if (result.success) {
        setAutomationStatus('triggered')
        setLastTrigger(new Date())
      } else {
        setAutomationStatus('failed')
      }
    } catch (error) {
      setAutomationStatus('failed')
      console.error('Failed to trigger social media automation:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestWebhooks = async () => {
    setIsLoading(true)
    try {
      // Test webhook endpoints
      const makeTest = fetch('/api/webhooks/blog/create', { method: 'GET' })
      const socialTest = fetch('/api/webhooks/social-media/trigger', { method: 'GET' })
      
      const [makeResponse, socialResponse] = await Promise.all([makeTest, socialTest])
      
      setWebhookStatus({
        makeWebhook: makeResponse.ok ? 'active' : 'inactive',
        socialMediaWebhook: socialResponse.ok ? 'active' : 'inactive',
        n8nWebhook: 'configured' // Would need actual test
      })
    } catch (error) {
      console.error('Webhook test failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'triggered':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'inactive':
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'configured':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <RefreshCw className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'triggered':
        return 'bg-green-100 text-green-800'
      case 'inactive':
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'configured':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Main Automation Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Make.com AI Blogging Automation
          </CardTitle>
          <CardDescription>
            Integrated with your Ultimate AI Blogging System + Social Media workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Webhook Status */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Webhook className="h-4 w-4" />
                Webhook Status
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Blog Creation</span>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(webhookStatus.makeWebhook)}
                    <Badge variant="outline" className={getStatusColor(webhookStatus.makeWebhook)}>
                      {webhookStatus.makeWebhook}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Social Media</span>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(webhookStatus.socialMediaWebhook)}
                    <Badge variant="outline" className={getStatusColor(webhookStatus.socialMediaWebhook)}>
                      {webhookStatus.socialMediaWebhook}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">N8N Backup</span>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(webhookStatus.n8nWebhook)}
                    <Badge variant="outline" className={getStatusColor(webhookStatus.n8nWebhook)}>
                      {webhookStatus.n8nWebhook}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Generation Info */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Settings className="h-4 w-4" />
                AI Generation
              </h4>
              {blogPost?.aiGenerated && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Generated</span>
                    <Badge variant="outline" className="bg-purple-100 text-purple-800">
                      Claude AI
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Workflow</span>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">
                      Make.com
                    </Badge>
                  </div>
                  {blogPost.automationMetadata?.generationTimestamp && (
                    <div className="text-xs text-gray-500">
                      Generated: {new Date(blogPost.automationMetadata.generationTimestamp).toLocaleString()}
                    </div>
                  )}
                </div>
              )}
              {!blogPost?.aiGenerated && (
                <div className="text-sm text-gray-500">
                  Manual content creation
                </div>
              )}
            </div>

            {/* Social Media Status */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Social Media
              </h4>
              <div className="space-y-2">
                {blogPost?.socialMedia ? (
                  <div className="space-y-1">
                    {Object.entries(blogPost.socialMedia).map(([platform, content]) => (
                      <div key={platform} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 capitalize">{platform}</span>
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          Ready
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    No social content generated
                  </div>
                )}
                
                {lastTrigger && (
                  <div className="text-xs text-gray-500">
                    Last trigger: {lastTrigger.toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            <Button 
              onClick={handleTestWebhooks}
              variant="outline"
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Test Webhooks
            </Button>

            {blogPost && (
              <Button 
                onClick={handleTriggerSocialMedia}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                Trigger Social Media
              </Button>
            )}

            <Button 
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => window.open('https://make.com', '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
              Open Make.com
            </Button>
          </div>

          {/* Status Messages */}
          {automationStatus !== 'idle' && (
            <div className="mt-4">
              <Alert className={automationStatus === 'triggered' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <AlertDescription>
                  {automationStatus === 'triggered' && 'Social media automation triggered successfully!'}
                  {automationStatus === 'failed' && 'Failed to trigger automation. Please check webhook configuration.'}
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhook Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Webhook Configuration
          </CardTitle>
          <CardDescription>
            Integration endpoints for your make.com automation workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Blog Creation Webhook</label>
              <div className="mt-1 p-2 bg-gray-50 rounded border text-sm font-mono">
                {typeof window !== 'undefined' && window.location.origin}/api/webhooks/blog/create
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Use this endpoint in your make.com scenario Module 30 (Webhook - Send Content)
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Social Media Trigger Webhook</label>
              <div className="mt-1 p-2 bg-gray-50 rounded border text-sm font-mono">
                {typeof window !== 'undefined' && window.location.origin}/api/webhooks/social-media/trigger
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Automatically triggered when blogs are published, or manually triggered above
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <h5 className="font-medium text-blue-900 mb-2">Integration Instructions:</h5>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Replace Module 30 webhook URL with the Blog Creation Webhook above</li>
                <li>• Add webhook signature verification using MAKE_WEBHOOK_SECRET</li>
                <li>• Social media automation will trigger automatically on blog.published events</li>
                <li>• Configure MAKE_SOCIAL_MEDIA_WEBHOOK_URL in your environment variables</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}