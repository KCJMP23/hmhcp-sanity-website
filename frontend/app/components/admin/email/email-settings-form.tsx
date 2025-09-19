'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/components/ui/use-toast'
import { 
  Settings,
  Mail,
  Server,
  Image,
  Palette,
  Save,
  TestTube,
  Shield,
  Link
} from 'lucide-react'
import { getEmailSettings, updateEmailSettings, sendEmail } from '@/lib/email/email-manager'
import type { EmailSettings } from '@/lib/email/email-manager'

export function EmailSettingsForm() {
  const [settings, setSettings] = useState<EmailSettings>({
    from_name: '',
    from_email: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testEmail, setTestEmail] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const data = await getEmailSettings()
      if (data) {
        setSettings(data)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load email settings',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const result = await updateEmailSettings(settings)
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Email settings saved successfully'
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save email settings',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: 'Error',
        description: 'Please enter a test email address',
        variant: 'destructive'
      })
      return
    }

    setTesting(true)
    try {
      const result = await sendEmail(
        testEmail,
        'Test Email from Healthcare Management Platform',
        '<h1>Test Email</h1><p>This is a test email to verify your email configuration is working correctly.</p>',
        settings
      )

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Test email sent successfully'
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send test email',
        variant: 'destructive'
      })
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-2 border-blue-600 rounded-sm border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">
            <Mail className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="smtp">
            <Server className="h-4 w-4 mr-2" />
            SMTP
          </TabsTrigger>
          <TabsTrigger value="branding">
            <Palette className="h-4 w-4 mr-2" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="test">
            <TestTube className="h-4 w-4 mr-2" />
            Test
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure your basic email settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="from_name">From Name</Label>
                  <Input
                    id="from_name"
                    value={settings.from_name}
                    onChange={(e) => setSettings({ ...settings, from_name: e.target.value })}
                    placeholder="Healthcare Management"
                  />
                </div>
                <div>
                  <Label htmlFor="from_email">From Email</Label>
                  <Input
                    id="from_email"
                    type="email"
                    value={settings.from_email}
                    onChange={(e) => setSettings({ ...settings, from_email: e.target.value })}
                    placeholder="noreply@hm-hcp.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="reply_to_email">Reply-To Email</Label>
                <Input
                  id="reply_to_email"
                  type="email"
                  value={settings.reply_to_email || ''}
                  onChange={(e) => setSettings({ ...settings, reply_to_email: e.target.value })}
                  placeholder="support@hm-hcp.com"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Where replies should be sent (optional)
                </p>
              </div>

              <div>
                <Label htmlFor="footer_text">Email Footer Text</Label>
                <Textarea
                  id="footer_text"
                  value={settings.footer_text || ''}
                  onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
                  placeholder="This email was sent by Healthcare Management HCP..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="unsubscribe_url">Unsubscribe URL</Label>
                <Input
                  id="unsubscribe_url"
                  value={settings.unsubscribe_url || ''}
                  onChange={(e) => setSettings({ ...settings, unsubscribe_url: e.target.value })}
                  placeholder="https://hm-hcp.com/unsubscribe"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="smtp">
          <Card>
            <CardHeader>
              <CardTitle>SMTP Configuration</CardTitle>
              <CardDescription>Configure your email server settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex gap-2">
                  <Shield className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900">Security Notice</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      SMTP credentials are encrypted and stored securely. Never share these credentials.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="smtp_host">SMTP Host</Label>
                  <Input
                    id="smtp_host"
                    value={settings.smtp_host || ''}
                    onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                    placeholder="smtp.sendgrid.net"
                  />
                </div>
                <div>
                  <Label htmlFor="smtp_port">SMTP Port</Label>
                  <Input
                    id="smtp_port"
                    type="number"
                    value={settings.smtp_port || ''}
                    onChange={(e) => setSettings({ ...settings, smtp_port: parseInt(e.target.value) })}
                    placeholder="587"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="smtp_user">SMTP Username</Label>
                <Input
                  id="smtp_user"
                  value={settings.smtp_user || ''}
                  onChange={(e) => setSettings({ ...settings, smtp_user: e.target.value })}
                  placeholder="apikey"
                />
              </div>

              <div>
                <Label htmlFor="smtp_password">SMTP Password</Label>
                <Input
                  id="smtp_password"
                  type="password"
                  placeholder="Enter new password to change"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Leave blank to keep existing password
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="smtp_secure"
                  checked={settings.smtp_secure ?? true}
                  onCheckedChange={(checked) => setSettings({ ...settings, smtp_secure: checked })}
                />
                <Label htmlFor="smtp_secure">Use TLS/SSL encryption</Label>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-full">
                <p className="text-sm text-blue-900 font-medium mb-2">Popular SMTP Providers:</p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• SendGrid: smtp.sendgrid.net (Port 587)</li>
                  <li>• AWS SES: email-smtp.[region].amazonaws.com (Port 587)</li>
                  <li>• Mailgun: smtp.mailgun.org (Port 587)</li>
                  <li>• Gmail: smtp.gmail.com (Port 587)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Email Branding</CardTitle>
              <CardDescription>Customize the appearance of your emails</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input
                  id="logo_url"
                  value={settings.logo_url || ''}
                  onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                  placeholder="https://hm-hcp.com/logo.png"
                />
                <p className="text-sm text-gray-600 mt-1">
                  URL to your logo image (recommended: 200x50px)
                </p>
              </div>

              <div>
                <Label htmlFor="primary_color">Primary Brand Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary_color"
                    value={settings.primary_color || '#2563eb'}
                    onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                    placeholder="#2563eb"
                    className="flex-1"
                  />
                  <input
                    type="color"
                    value={settings.primary_color || '#2563eb'}
                    onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                    className="h-10 w-20 border rounded cursor-pointer"
                  />
                </div>
              </div>

              {settings.logo_url && (
                <div>
                  <Label>Logo Preview</Label>
                  <div className="mt-2 p-4 border rounded-lg bg-gray-50">
                    <img
                      src={settings.logo_url}
                      alt="Email logo preview"
                      className="max-h-12 max-w-48"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle>Test Email Configuration</CardTitle>
              <CardDescription>Send a test email to verify your settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="test_email">Test Email Address</Label>
                <Input
                  id="test_email"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                />
              </div>

              <Button 
                onClick={handleTestEmail}
                disabled={testing || !testEmail}
                className="w-full"
              >
                {testing ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white rounded-sm border-t-transparent mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Test Email
                  </>
                )}
              </Button>

              <div className="p-4 bg-gray-50 rounded-full">
                <p className="text-sm text-gray-700">
                  The test email will include:
                </p>
                <ul className="text-sm text-gray-600 mt-2 space-y-1">
                  <li>• Your configured from name and email</li>
                  <li>• Your logo (if configured)</li>
                  <li>• Your brand colors</li>
                  <li>• Your footer text</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white rounded-sm border-t-transparent mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  )
}