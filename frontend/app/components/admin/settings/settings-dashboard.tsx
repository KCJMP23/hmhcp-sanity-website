'use client';

import React, { useState, useEffect } from 'react';
import { useCoreIntegration } from '@/hooks/use-core-integration';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Save, 
  Check, 
  AlertCircle, 
  Globe, 
  Search, 
  Shield, 
  Mail, 
  Palette,
  Database,
  Server,
  Cloud,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock
} from 'lucide-react';
import { FrostedCard } from '@/components/ui/frosted-card';
import { Typography } from '@/components/ui/apple-typography';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AppleButton } from '@/components/ui/apple-button';
import { AnimatePresence } from 'framer-motion';

export default function SettingsDashboard() {
  const { systemMonitoring, analytics } = useCoreIntegration();
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Mock data for demonstration
  const [settings] = useState({
    general: {
      siteName: 'HM Healthcare Partners',
      siteDescription: 'Transforming healthcare through innovative technology solutions',
      contactEmail: 'info@hm-hcp.com',
      contactPhone: '+1 (555) 123-4567',
      maintenanceMode: false,
      timezone: 'America/New_York',
      language: 'en'
    },
    seo: {
      metaTitle: 'HM Healthcare Partners - Innovative Healthcare Solutions',
      metaDescription: 'Leading healthcare technology solutions provider',
      metaKeywords: 'healthcare, technology, digital health, patient care',
      googleAnalyticsId: 'G-XXXXXXXXXX',
      enableSitemap: true,
      enableRobotsTxt: true,
      canonicalUrl: 'https://hm-hcp.com'
    },
    features: {
      enableBlog: true,
      enableNewsletter: true,
      enableContactForm: true,
      enableSearch: true,
      enableAnalytics: true,
      enableBackups: true,
      enableAIGeneration: true,
      enableMultiLanguage: true
    },
    email: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: '587',
      smtpUser: 'noreply@hm-hcp.com',
      smtpSecure: true,
      fromEmail: 'noreply@hm-hcp.com',
      fromName: 'HM Healthcare Partners',
      enableNotifications: true
    },
    appearance: {
      primaryColor: '#2563eb',
      accentColor: '#7c3aed',
      logoUrl: '/logo.png',
      faviconUrl: '/favicon.ico',
      customCss: '',
      enableDarkMode: false,
      enableAnimations: true
    },
    security: {
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      twoFactorRequired: true,
      ipWhitelist: '192.168.1.0/24, 10.0.0.0/8',
      sslEnabled: true,
      hipaaCompliant: true,
      auditLogging: true,
      realTimeMonitoring: true
    }
  });

  const [systemInfo] = useState({
    version: '1.0.0',
    environment: 'Production',
    lastUpdated: new Date().toLocaleDateString(),
    databaseSize: '2.4 GB',
    uptime: '99.9%',
    serverLocation: 'US East (N. Virginia)',
    sslStatus: 'Active',
    backupStatus: 'Last backup: 2 hours ago'
  });

  useEffect(() => {
    // Track page view
    analytics.trackPageView('/admin/settings');
    analytics.trackEvent('settings_dashboard_viewed', { section: 'settings' });
  }, [analytics]);

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('idle');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSaveStatus('success');
      
      // Log setting change
      await systemMonitoring.logMetric('settings_updated', 1, 'admin');
      
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleExportSettings = () => {
    console.log('Exporting settings...');
  };

  const handleImportSettings = () => {
    console.log('Importing settings...');
  };

  const getTabIcon = (tabName: string) => {
    switch (tabName) {
      case 'general':
        return <Globe className="h-4 w-4" />;
      case 'seo':
        return <Search className="h-4 w-4" />;
      case 'features':
        return <Shield className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'appearance':
        return <Palette className="h-4 w-4" />;
      case 'security':
        return <Lock className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const tabs = [
    { id: 'general', name: 'General', icon: <Globe className="h-4 w-4" /> },
    { id: 'seo', name: 'SEO', icon: <Search className="h-4 w-4" /> },
    { id: 'features', name: 'Features', icon: <Shield className="h-4 w-4" /> },
    { id: 'email', name: 'Email', icon: <Mail className="h-4 w-4" /> },
    { id: 'appearance', name: 'Appearance', icon: <Palette className="h-4 w-4" /> },
    { id: 'security', name: 'Security', icon: <Lock className="h-4 w-4" /> }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex justify-between items-center"
      >
        <div>
          <Typography variant="display" className="text-gray-900">System Settings</Typography>
          <Typography variant="body" className="text-gray-600">
            Configure website settings, preferences, and system parameters
          </Typography>
        </div>
        <div className="flex space-x-3">
          <AppleButton variant="outline" onClick={handleImportSettings}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </AppleButton>
          <AppleButton variant="outline" onClick={handleExportSettings}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </AppleButton>
          <AppleButton onClick={handleSave} disabled={saving}>
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </AppleButton>
        </div>
      </motion.div>

      {/* Save Status Alert */}
      <AnimatePresence mode="wait">
        {saveStatus === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <FrostedCard className="border-green-200 bg-green-50/50">
              <div className="p-4 flex items-center space-x-3">
                <Check className="h-5 w-5 text-green-600" />
                <Typography variant="label" className="text-green-800">
                  Settings saved successfully!
                </Typography>
              </div>
            </FrostedCard>
          </motion.div>
        )}

        {saveStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <FrostedCard className="border-red-200 bg-red-50/50">
              <div className="p-4 flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <Typography variant="label" className="text-red-800">
                  Failed to save settings. Please try again.
                </Typography>
              </div>
            </FrostedCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="flex space-x-1 p-1 bg-gray-100 rounded-2xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              {tab.icon}
              <span className="font-medium">{tab.name}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {activeTab === 'general' && (
          <FrostedCard>
            <div className="p-6">
              <Typography variant="heading3" className="mb-6 text-gray-900">
                General Settings
              </Typography>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700">Site Name</label>
                  <input
                    type="text"
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={settings.general.siteName}
                    readOnly
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Contact Email</label>
                  <input
                    type="email"
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={settings.general.contactEmail}
                    readOnly
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Contact Phone</label>
                  <input
                    type="tel"
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={settings.general.contactPhone}
                    readOnly
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Timezone</label>
                  <input
                    type="text"
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={settings.general.timezone}
                    readOnly
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Site Description</label>
                  <textarea
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    value={settings.general.siteDescription}
                    readOnly
                  />
                </div>
              </div>
            </div>
          </FrostedCard>
        )}

        {activeTab === 'seo' && (
          <FrostedCard>
            <div className="p-6">
              <Typography variant="heading3" className="mb-6 text-gray-900">
                SEO Settings
              </Typography>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700">Meta Title</label>
                  <input
                    type="text"
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={settings.seo.metaTitle}
                    readOnly
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Google Analytics ID</label>
                  <input
                    type="text"
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={settings.seo.googleAnalyticsId}
                    readOnly
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Meta Description</label>
                  <textarea
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    value={settings.seo.metaDescription}
                    readOnly
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Meta Keywords</label>
                  <input
                    type="text"
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={settings.seo.metaKeywords}
                    readOnly
                  />
                </div>
              </div>
            </div>
          </FrostedCard>
        )}

        {activeTab === 'features' && (
          <FrostedCard>
            <div className="p-6">
              <Typography variant="heading3" className="mb-6 text-gray-900">
                Feature Settings
              </Typography>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(settings.features).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={value}
                      readOnly
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^enable /, 'Enable ')}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </FrostedCard>
        )}

        {activeTab === 'email' && (
          <FrostedCard>
            <div className="p-6">
              <Typography variant="heading3" className="mb-6 text-gray-900">
                Email Settings
              </Typography>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700">SMTP Host</label>
                  <input
                    type="text"
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={settings.email.smtpHost}
                    readOnly
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">SMTP Port</label>
                  <input
                    type="text"
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={settings.email.smtpPort}
                    readOnly
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">From Email</label>
                  <input
                    type="email"
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={settings.email.fromEmail}
                    readOnly
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">From Name</label>
                  <input
                    type="text"
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={settings.email.fromName}
                    readOnly
                  />
                </div>
              </div>
            </div>
          </FrostedCard>
        )}

        {activeTab === 'appearance' && (
          <FrostedCard>
            <div className="p-6">
              <Typography variant="heading3" className="mb-6 text-gray-900">
                Appearance Settings
              </Typography>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700">Primary Color</label>
                  <div className="mt-1 flex gap-2">
                    <input
                      type="color"
                      className="h-10 w-20 rounded-xl border border-gray-200"
                      value={settings.appearance.primaryColor}
                      readOnly
                    />
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={settings.appearance.primaryColor}
                      readOnly
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Accent Color</label>
                  <div className="mt-1 flex gap-2">
                    <input
                      type="color"
                      className="h-10 w-20 rounded-xl border border-gray-200"
                      value={settings.appearance.accentColor}
                      readOnly
                    />
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={settings.appearance.accentColor}
                      readOnly
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Logo URL</label>
                  <input
                    type="text"
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={settings.appearance.logoUrl}
                    readOnly
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Favicon URL</label>
                  <input
                    type="text"
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={settings.appearance.faviconUrl}
                    readOnly
                  />
                </div>
              </div>
            </div>
          </FrostedCard>
        )}

        {activeTab === 'security' && (
          <FrostedCard>
            <div className="p-6">
              <Typography variant="heading3" className="mb-6 text-gray-900">
                Security Settings
              </Typography>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700">Session Timeout (minutes)</label>
                  <input
                    type="number"
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={settings.security.sessionTimeout}
                    readOnly
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Max Login Attempts</label>
                  <input
                    type="number"
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={settings.security.maxLoginAttempts}
                    readOnly
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">IP Whitelist</label>
                  <input
                    type="text"
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={settings.security.ipWhitelist}
                    readOnly
                  />
                </div>
                <div className="md:col-span-2 space-y-3">
                  {Object.entries(settings.security).slice(3).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={typeof value === 'boolean' ? value : false}
                        readOnly
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="text-sm font-medium text-gray-700">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^enable /, 'Enable ')}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FrostedCard>
        )}
      </motion.div>

      {/* System Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Typography variant="heading2" className="mb-6 text-gray-900">
          System Information
        </Typography>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FrostedCard>
            <div className="p-6 text-center">
              <Server className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              <Typography variant="heading4" className="text-gray-900 mb-2">
                Version
              </Typography>
              <Typography variant="body" className="text-gray-600">
                {systemInfo.version}
              </Typography>
            </div>
          </FrostedCard>

          <FrostedCard>
            <div className="p-6 text-center">
              <Cloud className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <Typography variant="heading4" className="text-gray-900 mb-2">
                Environment
              </Typography>
              <Typography variant="body" className="text-gray-600">
                {systemInfo.environment}
              </Typography>
            </div>
          </FrostedCard>

          <FrostedCard>
            <div className="p-6 text-center">
              <Database className="h-12 w-12 text-purple-600 mx-auto mb-3" />
              <Typography variant="heading4" className="text-gray-900 mb-2">
                Database Size
              </Typography>
              <Typography variant="body" className="text-gray-600">
                {systemInfo.databaseSize}
              </Typography>
            </div>
          </FrostedCard>

          <FrostedCard>
            <div className="p-6 text-center">
              <Shield className="h-12 w-12 text-orange-600 mx-auto mb-3" />
              <Typography variant="heading4" className="text-gray-900 mb-2">
                Uptime
              </Typography>
              <Typography variant="body" className="text-gray-600">
                {systemInfo.uptime}
              </Typography>
            </div>
          </FrostedCard>
        </div>
      </motion.div>
    </div>
  );
}
