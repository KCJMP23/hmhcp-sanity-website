'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ConsistentCard } from '@/components/design-system/consistency-wrapper'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Info, Shield, Settings, MessageSquare } from 'lucide-react'

interface CommentSettings {
  general: {
    allowComments: boolean
    requireApproval: boolean
    requireNameEmail: boolean
    allowAnonymous: boolean
    closeCommentsAfterDays: number
    threadedComments: boolean
    maxThreadDepth: number
    commentsPerPage: number
    defaultSortOrder: 'newest' | 'oldest' | 'popular'
  }
  moderation: {
    autoApproveKnownUsers: boolean
    maxLinksBeforeModeration: number
    moderationKeywords: string[]
    blacklistKeywords: string[]
    allowedHtmlTags: string[]
    spamProtection: 'basic' | 'moderate' | 'strict'
    requireCaptcha: boolean
  }
  notifications: {
    notifyOnNewComment: boolean
    notifyOnApprovalNeeded: boolean
    notifyAuthorOnReply: boolean
    emailFrom: string
    adminEmails: string[]
  }
}

const defaultSettings: CommentSettings = {
  general: {
    allowComments: true,
    requireApproval: true,
    requireNameEmail: true,
    allowAnonymous: false,
    closeCommentsAfterDays: 30,
    threadedComments: true,
    maxThreadDepth: 3,
    commentsPerPage: 50,
    defaultSortOrder: 'newest'
  },
  moderation: {
    autoApproveKnownUsers: true,
    maxLinksBeforeModeration: 2,
    moderationKeywords: ['viagra', 'casino', 'lottery'],
    blacklistKeywords: ['spam', 'scam'],
    allowedHtmlTags: ['a', 'b', 'i', 'strong', 'em', 'code', 'pre'],
    spamProtection: 'moderate',
    requireCaptcha: true
  },
  notifications: {
    notifyOnNewComment: true,
    notifyOnApprovalNeeded: true,
    notifyAuthorOnReply: true,
    emailFrom: 'noreply@hmhealthcarepartners.com',
    adminEmails: ['admin@hmhealthcarepartners.com']
  }
}

export function CommentSettings() {
  const [settings, setSettings] = useState<CommentSettings>(defaultSettings)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    // In production, save to API
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSaving(false)
    toast.success('Comment settings saved successfully')
  }

  const updateSetting = (
    category: keyof CommentSettings,
    key: string,
    value: any
  ) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-light tracking-tight text-gray-900 dark:text-white mb-2">
          Comment Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Configure how comments work on your site
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="moderation" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Moderation
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <ConsistentCard>
            <div className="p-6 space-y-6">
              <h2 className="text-lg font-semibold">General Settings</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow Comments</Label>
                    <p className="text-sm text-gray-500">Enable commenting on posts and pages</p>
                  </div>
                  <Switch
                    checked={settings.general.allowComments}
                    onCheckedChange={(checked) => 
                      updateSetting('general', 'allowComments', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Approval</Label>
                    <p className="text-sm text-gray-500">Comments must be approved before appearing</p>
                  </div>
                  <Switch
                    checked={settings.general.requireApproval}
                    onCheckedChange={(checked) => 
                      updateSetting('general', 'requireApproval', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Threaded Comments</Label>
                    <p className="text-sm text-gray-500">Allow replies to comments</p>
                  </div>
                  <Switch
                    checked={settings.general.threadedComments}
                    onCheckedChange={(checked) => 
                      updateSetting('general', 'threadedComments', checked)
                    }
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Max Thread Depth</Label>
                    <Input
                      type="number"
                      value={settings.general.maxThreadDepth}
                      onChange={(e) => 
                        updateSetting('general', 'maxThreadDepth', parseInt(e.target.value))
                      }
                      min="1"
                      max="10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Comments Per Page</Label>
                    <Input
                      type="number"
                      value={settings.general.commentsPerPage}
                      onChange={(e) => 
                        updateSetting('general', 'commentsPerPage', parseInt(e.target.value))
                      }
                      min="10"
                      max="100"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Close Comments After Days</Label>
                  <Input
                    type="number"
                    value={settings.general.closeCommentsAfterDays}
                    onChange={(e) => 
                      updateSetting('general', 'closeCommentsAfterDays', parseInt(e.target.value))
                    }
                    min="0"
                    placeholder="0 = never close"
                  />
                  <p className="text-sm text-gray-500">
                    Automatically close comments on posts older than this many days
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Default Sort Order</Label>
                  <Select
                    value={settings.general.defaultSortOrder}
                    onValueChange={(value) => 
                      updateSetting('general', 'defaultSortOrder', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="popular">Most Popular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </ConsistentCard>
        </TabsContent>

        {/* Moderation Settings */}
        <TabsContent value="moderation">
          <ConsistentCard>
            <div className="p-6 space-y-6">
              <h2 className="text-lg font-semibold">Moderation Settings</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-approve Known Users</Label>
                    <p className="text-sm text-gray-500">Skip moderation for users with approved comments</p>
                  </div>
                  <Switch
                    checked={settings.moderation.autoApproveKnownUsers}
                    onCheckedChange={(checked) => 
                      updateSetting('moderation', 'autoApproveKnownUsers', checked)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Links Before Moderation</Label>
                  <Input
                    type="number"
                    value={settings.moderation.maxLinksBeforeModeration}
                    onChange={(e) => 
                      updateSetting('moderation', 'maxLinksBeforeModeration', parseInt(e.target.value))
                    }
                    min="0"
                    max="10"
                  />
                  <p className="text-sm text-gray-500">
                    Comments with more links than this will be held for moderation
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Spam Protection Level</Label>
                  <Select
                    value={settings.moderation.spamProtection}
                    onValueChange={(value) => 
                      updateSetting('moderation', 'spamProtection', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="strict">Strict</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Moderation Keywords</Label>
                  <Textarea
                    value={settings.moderation.moderationKeywords.join('\n')}
                    onChange={(e) => 
                      updateSetting('moderation', 'moderationKeywords', 
                        e.target.value.split('\n').filter(k => k.trim())
                      )
                    }
                    placeholder="One keyword per line"
                    rows={4}
                  />
                  <p className="text-sm text-gray-500">
                    Comments containing these words will be held for moderation
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Blacklist Keywords</Label>
                  <Textarea
                    value={settings.moderation.blacklistKeywords.join('\n')}
                    onChange={(e) => 
                      updateSetting('moderation', 'blacklistKeywords', 
                        e.target.value.split('\n').filter(k => k.trim())
                      )
                    }
                    placeholder="One keyword per line"
                    rows={4}
                  />
                  <p className="text-sm text-gray-500">
                    Comments containing these words will be marked as spam
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require CAPTCHA</Label>
                    <p className="text-sm text-gray-500">Protect against automated spam</p>
                  </div>
                  <Switch
                    checked={settings.moderation.requireCaptcha}
                    onCheckedChange={(checked) => 
                      updateSetting('moderation', 'requireCaptcha', checked)
                    }
                  />
                </div>
              </div>
            </div>
          </ConsistentCard>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <ConsistentCard>
            <div className="p-6 space-y-6">
              <h2 className="text-lg font-semibold">Notification Settings</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notify on New Comments</Label>
                    <p className="text-sm text-gray-500">Send email when new comments are posted</p>
                  </div>
                  <Switch
                    checked={settings.notifications.notifyOnNewComment}
                    onCheckedChange={(checked) => 
                      updateSetting('notifications', 'notifyOnNewComment', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notify on Approval Needed</Label>
                    <p className="text-sm text-gray-500">Alert when comments need moderation</p>
                  </div>
                  <Switch
                    checked={settings.notifications.notifyOnApprovalNeeded}
                    onCheckedChange={(checked) => 
                      updateSetting('notifications', 'notifyOnApprovalNeeded', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notify Authors on Reply</Label>
                    <p className="text-sm text-gray-500">Email commenters when someone replies</p>
                  </div>
                  <Switch
                    checked={settings.notifications.notifyAuthorOnReply}
                    onCheckedChange={(checked) => 
                      updateSetting('notifications', 'notifyAuthorOnReply', checked)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email From Address</Label>
                  <Input
                    type="email"
                    value={settings.notifications.emailFrom}
                    onChange={(e) => 
                      updateSetting('notifications', 'emailFrom', e.target.value)
                    }
                    placeholder="noreply@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Admin Email Addresses</Label>
                  <Textarea
                    value={settings.notifications.adminEmails.join('\n')}
                    onChange={(e) => 
                      updateSetting('notifications', 'adminEmails', 
                        e.target.value.split('\n').filter(e => e.trim())
                      )
                    }
                    placeholder="One email per line"
                    rows={3}
                  />
                  <p className="text-sm text-gray-500">
                    These addresses will receive moderation notifications
                  </p>
                </div>
              </div>
            </div>
          </ConsistentCard>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="mt-8 flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={isSaving}
          className="min-w-[120px]"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}