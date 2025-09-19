'use client';

import React, { useState, useEffect } from 'react';
import { useCoreIntegration } from '@/hooks/use-core-integration';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Lock, 
  Key, 
  AlertTriangle, 
  Activity,
  UserCheck,
  Settings,
  Eye,
  EyeOff,
  RefreshCw,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Globe,
  Clock,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { FrostedCard } from '@/components/ui/frosted-card';
import { Typography } from '@/components/ui/apple-typography';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AppleButton } from '@/components/ui/apple-button';

export default function SecurityDashboard() {
  const { systemMonitoring, analytics } = useCoreIntegration();
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock data for demonstration
  const [securityStats] = useState({
    securityScore: 85,
    activeSessions: 12,
    failedLogins: 3,
    twoFactorEnabled: 8,
    totalUsers: 15,
    blockedIPs: 5,
    lastScan: '2 hours ago',
    threatsBlocked: 23
  });

  const [securityLogs] = useState([
    { id: 1, timestamp: '2 minutes ago', type: 'login', user: 'admin@hm-hcp.com', ip: '192.168.1.1', description: 'Successful login', severity: 'low' },
    { id: 2, timestamp: '5 minutes ago', type: 'failed_login', user: 'unknown@example.com', ip: '10.0.0.1', description: 'Failed login attempt - invalid credentials', severity: 'medium' },
    { id: 3, timestamp: '12 minutes ago', type: 'setting_change', user: 'admin@hm-hcp.com', ip: '192.168.1.1', description: 'Updated security settings', severity: 'low' },
    { id: 4, timestamp: '18 minutes ago', type: 'permission_denied', user: 'user@example.com', ip: '203.0.113.1', description: 'Access denied to admin panel', severity: 'medium' },
    { id: 5, timestamp: '25 minutes ago', type: 'data_access', user: 'analyst@hm-hcp.com', ip: '192.168.1.5', description: 'Accessed sensitive data', severity: 'low' }
  ]);

  const [activeSessions] = useState([
    { id: 1, user: 'admin@hm-hcp.com', ip: '192.168.1.1', device: 'Chrome on macOS', location: 'San Francisco, CA', lastActive: '2 minutes ago', startTime: '30 minutes ago' },
    { id: 2, user: 'editor@hm-hcp.com', ip: '192.168.1.2', device: 'Firefox on Windows', location: 'New York, NY', lastActive: '5 minutes ago', startTime: '45 minutes ago' },
    { id: 3, user: 'analyst@hm-hcp.com', ip: '192.168.1.5', device: 'Safari on iOS', location: 'Chicago, IL', lastActive: '8 minutes ago', startTime: '1 hour ago' }
  ]);

  const [securitySettings] = useState({
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    twoFactorRequired: true,
    ipWhitelist: '192.168.1.0/24, 10.0.0.0/8',
    sslEnabled: true,
    hipaaCompliant: true,
    auditLogging: true,
    realTimeMonitoring: true
  });

  useEffect(() => {
    // Track page view
    analytics.trackPageView('/admin/security');
    analytics.trackEvent('security_dashboard_viewed', { section: 'security' });
  }, [analytics]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const handleExportLogs = () => {
    console.log('Exporting security logs...');
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'low':
        return <Badge variant="default">Low</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      default:
        return <Badge variant="default">{severity}</Badge>;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'logout':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'failed_login':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'permission_denied':
        return <Lock className="h-4 w-4 text-orange-600" />;
      case 'data_access':
        return <Eye className="h-4 w-4 text-purple-600" />;
      case 'setting_change':
        return <Settings className="h-4 w-4 text-gray-600" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getSecurityStatusColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSecurityStatusText = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Attention';
  };

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
          <Typography variant="display" className="text-gray-900">Security Center</Typography>
          <Typography variant="body" className="text-gray-600">
            Monitor and manage system security, access control, and compliance
          </Typography>
        </div>
        <div className="flex space-x-3">
          <AppleButton variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </AppleButton>
          <AppleButton variant="outline" onClick={handleExportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </AppleButton>
        </div>
      </motion.div>

      {/* Security Overview Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <FrostedCard className="hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Shield className="h-8 w-8 text-blue-600" />
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <Typography variant="display" className={`text-3xl font-light mb-2 ${getSecurityStatusColor(securityStats.securityScore)}`}>
              {securityStats.securityScore}/100
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Security Score</Typography>
            <Progress value={securityStats.securityScore} className="h-2" />
            <Typography variant="small" className={`mt-2 ${getSecurityStatusColor(securityStats.securityScore)}`}>
              {getSecurityStatusText(securityStats.securityScore)} protection level
            </Typography>
          </div>
        </FrostedCard>

        <FrostedCard className="hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <UserCheck className="h-8 w-8 text-green-600" />
              <Activity className="h-5 w-5 text-blue-500" />
            </div>
            <Typography variant="display" className="text-3xl font-light text-gray-900 mb-2">
              {securityStats.activeSessions}
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Active Sessions</Typography>
            <Progress value={75} className="h-2" />
            <Typography variant="small" className="text-green-600 mt-2">
              Currently active users
            </Typography>
          </div>
        </FrostedCard>

        <FrostedCard className="hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <TrendingUp className="h-5 w-5 text-red-500" />
            </div>
            <Typography variant="display" className="text-3xl font-light text-gray-900 mb-2">
              {securityStats.failedLogins}
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Failed Logins</Typography>
            <Progress value={30} className="h-2" />
            <Typography variant="small" className="text-orange-600 mt-2">
              Last 24 hours
            </Typography>
          </div>
        </FrostedCard>

        <FrostedCard className="hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Key className="h-8 w-8 text-purple-600" />
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <Typography variant="display" className="text-3xl font-light text-gray-900 mb-2">
              {securityStats.twoFactorEnabled}/{securityStats.totalUsers}
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">2FA Enabled</Typography>
            <Progress value={(securityStats.twoFactorEnabled / securityStats.totalUsers) * 100} className="h-2" />
            <Typography variant="small" className="text-purple-600 mt-2">
              Admin users protected
            </Typography>
          </div>
        </FrostedCard>
      </motion.div>

      {/* Security Status Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Typography variant="heading2" className="mb-6 text-gray-900">
          Security Status
        </Typography>
        <FrostedCard>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200/50 rounded-2xl bg-white/50 backdrop-blur-sm">
                <div className="flex items-center space-x-4">
                  <Lock className="h-6 w-6 text-green-600" />
                  <div>
                    <Typography variant="label" className="text-gray-900">
                      SSL/TLS Encryption
                    </Typography>
                    <Typography variant="small" className="text-gray-600">
                      All data is encrypted in transit
                    </Typography>
                  </div>
                </div>
                <Badge variant="default">Active</Badge>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200/50 rounded-2xl bg-white/50 backdrop-blur-sm">
                <div className="flex items-center space-x-4">
                  <Key className="h-6 w-6 text-blue-600" />
                  <div>
                    <Typography variant="label" className="text-gray-900">
                      Two-Factor Authentication
                    </Typography>
                    <Typography variant="small" className="text-gray-600">
                      Additional security layer for admin accounts
                    </Typography>
                  </div>
                </div>
                <Badge variant="secondary">Partial</Badge>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200/50 rounded-2xl bg-white/50 backdrop-blur-sm">
                <div className="flex items-center space-x-4">
                  <Shield className="h-6 w-6 text-green-600" />
                  <div>
                    <Typography variant="label" className="text-gray-900">
                      HIPAA Compliance
                    </Typography>
                    <Typography variant="small" className="text-gray-600">
                      Healthcare data protection standards
                    </Typography>
                  </div>
                </div>
                <Badge variant="default">Compliant</Badge>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200/50 rounded-2xl bg-white/50 backdrop-blur-sm">
                <div className="flex items-center space-x-4">
                  <Activity className="h-6 w-6 text-green-600" />
                  <div>
                    <Typography variant="label" className="text-gray-900">
                      Real-time Monitoring
                    </Typography>
                    <Typography variant="small" className="text-gray-600">
                      Continuous security threat detection
                    </Typography>
                  </div>
                </div>
                <Badge variant="default">Active</Badge>
              </div>
            </div>
          </div>
        </FrostedCard>
      </motion.div>

      {/* Security Activity Log */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Typography variant="heading2" className="mb-6 text-gray-900">
          Security Activity Log
        </Typography>
        <FrostedCard>
          <div className="p-6">
            <div className="space-y-4">
              {securityLogs.map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 border border-gray-200/50 rounded-2xl bg-white/50 backdrop-blur-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center space-x-4">
                    {getActivityIcon(log.type)}
                    <div>
                      <Typography variant="label" className="text-gray-900">
                        {log.description}
                      </Typography>
                      <Typography variant="small" className="text-gray-600">
                        {log.user} • {log.ip} • {log.timestamp}
                      </Typography>
                    </div>
                  </div>
                  {getSeverityBadge(log.severity)}
                </motion.div>
              ))}
            </div>
          </div>
        </FrostedCard>
      </motion.div>

      {/* Active Sessions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Typography variant="heading2" className="mb-6 text-gray-900">
          Active Sessions
        </Typography>
        <FrostedCard>
          <div className="p-6">
            <div className="space-y-4">
              {activeSessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 border border-gray-200/50 rounded-2xl bg-white/50 backdrop-blur-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <Typography variant="label" className="text-gray-900">
                        {session.user}
                      </Typography>
                      <Typography variant="small" className="text-gray-600">
                        {session.device} • {session.location}
                      </Typography>
                      <Typography variant="small" className="text-gray-500">
                        Started: {session.startTime} • Last active: {session.lastActive}
                      </Typography>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <AppleButton variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </AppleButton>
                    <AppleButton variant="outline" size="sm">
                      <XCircle className="h-4 w-4 mr-2" />
                      Terminate
                    </AppleButton>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </FrostedCard>
      </motion.div>

      {/* Security Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <Typography variant="heading2" className="mb-6 text-gray-900">
          Security Settings
        </Typography>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FrostedCard>
            <div className="p-6">
              <Typography variant="heading4" className="mb-4 text-gray-900">
                Session Management
              </Typography>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Session Timeout (minutes)</label>
                  <input
                    type="number"
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={securitySettings.sessionTimeout}
                    readOnly
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Max Login Attempts</label>
                  <input
                    type="number"
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={securitySettings.maxLoginAttempts}
                    readOnly
                  />
                </div>
              </div>
            </div>
          </FrostedCard>

          <FrostedCard>
            <div className="p-6">
              <Typography variant="heading4" className="mb-4 text-gray-900">
                Access Control
              </Typography>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={securitySettings.twoFactorRequired}
                    readOnly
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Require Two-Factor Authentication
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={securitySettings.auditLogging}
                    readOnly
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Enable Audit Logging
                  </label>
                </div>
              </div>
            </div>
          </FrostedCard>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <Typography variant="heading2" className="mb-6 text-gray-900">
          Quick Actions
        </Typography>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FrostedCard className="hover:shadow-xl transition-all duration-300">
            <div className="p-6 text-center">
              <Shield className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <Typography variant="heading4" className="text-gray-900 mb-2">
                Security Scan
              </Typography>
              <Typography variant="body" className="text-gray-600 mb-4">
                Run comprehensive security audit
              </Typography>
              <AppleButton variant="outline" size="sm">
                <Activity className="h-4 w-4 mr-2" />
                Start Scan
              </AppleButton>
            </div>
          </FrostedCard>

          <FrostedCard className="hover:shadow-xl transition-all duration-300">
            <div className="p-6 text-center">
              <Users className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <Typography variant="heading4" className="text-gray-900 mb-2">
                User Permissions
              </Typography>
              <Typography variant="body" className="text-gray-600 mb-4">
                Manage user roles and access
              </Typography>
              <AppleButton variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </AppleButton>
            </div>
          </FrostedCard>

          <FrostedCard className="hover:shadow-xl transition-all duration-300">
            <div className="p-6 text-center">
              <BarChart3 className="h-16 w-16 text-purple-600 mx-auto mb-4" />
              <Typography variant="heading4" className="text-gray-900 mb-2">
                Security Reports
              </Typography>
              <Typography variant="body" className="text-gray-600 mb-4">
                Generate security compliance reports
              </Typography>
              <AppleButton variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Generate
              </AppleButton>
            </div>
          </FrostedCard>
        </div>
      </motion.div>
    </div>
  );
}
