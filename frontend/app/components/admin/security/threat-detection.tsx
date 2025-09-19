'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Lock, 
  Unlock, 
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  RefreshCw,
  Download,
  Settings,
  BarChart3,
  Zap,
  Brain,
  AlertCircle,
  ShieldCheck,
  ShieldX,
  UserX,
  Globe,
  Server,
  Database,
  Network,
  FileText,
  Search,
  Filter,
  Bell,
  BellOff,
  Target,
  Crosshair,
  Radar,
  Satellite,
  Wifi,
  WifiOff,
  Key,
  UserCheck,
  Fingerprint,
  Scan,
  Bug,
  AlertOctagon,
  Info,
  HelpCircle
} from 'lucide-react';
import { FrostedCard } from '@/components/ui/frosted-card';
import { Typography } from '@/components/ui/apple-typography';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AppleButton } from '@/components/ui/apple-button';

interface SecurityThreat {
  id: string;
  type: 'malware' | 'intrusion' | 'data_breach' | 'ddos' | 'phishing' | 'insider_threat' | 'vulnerability' | 'anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'detected' | 'investigating' | 'contained' | 'resolved' | 'false_positive';
  title: string;
  description: string;
  source: string;
  target: string;
  confidence: number;
  detectionTime: Date;
  lastUpdated: Date;
  affectedSystems: string[];
  indicators: string[];
  aiAnalysis: string;
  recommendedActions: string[];
  riskScore: number;
}

interface SecurityMetrics {
  totalThreats: number;
  activeThreats: number;
  containedThreats: number;
  resolvedThreats: number;
  falsePositives: number;
  avgResponseTime: number;
  threatDetectionRate: number;
  systemVulnerabilities: number;
  securityScore: number;
  lastScanTime: Date;
  nextScanTime: Date;
}

interface SecurityEvent {
  id: string;
  timestamp: Date;
  type: 'login_attempt' | 'file_access' | 'network_connection' | 'data_export' | 'config_change' | 'system_alert';
  severity: 'info' | 'warning' | 'error' | 'critical';
  user: string;
  ipAddress: string;
  location: string;
  description: string;
  status: 'normal' | 'suspicious' | 'blocked' | 'investigating';
  riskScore: number;
}

export default function ThreatDetection() {
  const [threats, setThreats] = useState<SecurityThreat[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalThreats: 0,
    activeThreats: 0,
    containedThreats: 0,
    resolvedThreats: 0,
    falsePositives: 0,
    avgResponseTime: 0,
    threatDetectionRate: 0,
    systemVulnerabilities: 0,
    securityScore: 0,
    lastScanTime: new Date(),
    nextScanTime: new Date()
  });
  const [selectedThreat, setSelectedThreat] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for demonstration
  useEffect(() => {
    const mockThreats: SecurityThreat[] = [
      {
        id: '1',
        type: 'intrusion',
        severity: 'high',
        status: 'investigating',
        title: 'Suspicious Login Pattern Detected',
        description: 'Multiple failed login attempts from unusual geographic locations',
        source: '192.168.1.100',
        target: 'Admin Portal',
        confidence: 87,
        detectionTime: new Date(Date.now() - 1800000), // 30 minutes ago
        lastUpdated: new Date(Date.now() - 900000), // 15 minutes ago
        affectedSystems: ['Admin Portal', 'User Database'],
        indicators: ['Failed login attempts', 'Geographic anomaly', 'Time pattern'],
        aiAnalysis: 'AI analysis indicates 87% probability of brute force attack attempt. Pattern matches known attack signatures.',
        recommendedActions: ['Block source IP', 'Enable 2FA for affected accounts', 'Review login logs'],
        riskScore: 78
      },
      {
        id: '2',
        type: 'data_breach',
        severity: 'critical',
        status: 'detected',
        title: 'Unauthorized Data Access Attempt',
        description: 'Attempted access to sensitive patient data from unauthorized user account',
        source: 'Internal Network',
        target: 'Patient Records System',
        confidence: 94,
        detectionTime: new Date(Date.now() - 3600000), // 1 hour ago
        lastUpdated: new Date(Date.now() - 1800000), // 30 minutes ago
        affectedSystems: ['Patient Records System', 'User Authentication'],
        indicators: ['Unauthorized access attempt', 'Sensitive data query', 'Privilege escalation'],
        aiAnalysis: 'Critical threat detected with 94% confidence. AI analysis suggests potential insider threat or compromised credentials.',
        recommendedActions: ['Immediate account suspension', 'Data access audit', 'Security incident response'],
        riskScore: 95
      },
      {
        id: '3',
        type: 'malware',
        severity: 'medium',
        status: 'contained',
        title: 'Suspicious File Upload Detected',
        description: 'Malware signature detected in uploaded file',
        source: 'File Upload System',
        target: 'Content Management System',
        confidence: 76,
        detectionTime: new Date(Date.now() - 7200000), // 2 hours ago
        lastUpdated: new Date(Date.now() - 3600000), // 1 hour ago
        affectedSystems: ['File Upload System', 'Content Management'],
        indicators: ['Malware signature match', 'Suspicious file type', 'Anomalous behavior'],
        aiAnalysis: 'Medium threat contained. AI analysis shows 76% confidence in malware detection. File quarantined successfully.',
        recommendedActions: ['File quarantine verification', 'User account review', 'Security scan update'],
        riskScore: 65
      }
    ];

    const mockEvents: SecurityEvent[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 300000), // 5 minutes ago
        type: 'login_attempt',
        severity: 'warning',
        user: 'admin@hmhcp.com',
        ipAddress: '192.168.1.100',
        location: 'New York, NY',
        description: 'Multiple failed login attempts detected',
        status: 'suspicious',
        riskScore: 45
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 600000), // 10 minutes ago
        type: 'file_access',
        severity: 'info',
        user: 'user@hmhcp.com',
        ipAddress: '192.168.1.101',
        location: 'Boston, MA',
        description: 'Access to sensitive document',
        status: 'normal',
        riskScore: 15
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 900000), // 15 minutes ago
        type: 'network_connection',
        severity: 'error',
        user: 'system',
        ipAddress: '10.0.0.50',
        location: 'Internal',
        description: 'Unusual network connection pattern',
        status: 'investigating',
        riskScore: 72
      }
    ];

    const mockMetrics: SecurityMetrics = {
      totalThreats: 23,
      activeThreats: 2,
      containedThreats: 15,
      resolvedThreats: 6,
      falsePositives: 3,
      avgResponseTime: 1800,
      threatDetectionRate: 94.2,
      systemVulnerabilities: 7,
      securityScore: 87.5,
      lastScanTime: new Date(Date.now() - 3600000), // 1 hour ago
      nextScanTime: new Date(Date.now() + 3600000) // 1 hour from now
    };

    setThreats(mockThreats);
    setEvents(mockEvents);
    setMetrics(mockMetrics);
  }, []);

  const getThreatTypeIcon = (type: SecurityThreat['type']) => {
    switch (type) {
      case 'malware':
        return <Bug className="h-5 w-5 text-red-600" />;
      case 'intrusion':
        return <UserX className="h-5 w-5 text-orange-600" />;
      case 'data_breach':
        return <Database className="h-5 w-5 text-purple-600" />;
      case 'ddos':
        return <Network className="h-5 w-5 text-blue-600" />;
      case 'phishing':
        return <Globe className="h-5 w-5 text-yellow-600" />;
      case 'insider_threat':
        return <UserX className="h-5 w-5 text-red-600" />;
      case 'vulnerability':
        return <Bug className="h-5 w-5 text-yellow-600" />;
      case 'anomaly':
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getSeverityBadge = (severity: SecurityThreat['severity']) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'high':
        return <Badge variant="default">High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: SecurityThreat['status']) => {
    switch (status) {
      case 'detected':
        return <Badge variant="destructive">Detected</Badge>;
      case 'investigating':
        return <Badge variant="secondary">Investigating</Badge>;
      case 'contained':
        return <Badge variant="outline">Contained</Badge>;
      case 'resolved':
        return <Badge variant="outline">Resolved</Badge>;
      case 'false_positive':
        return <Badge variant="outline">False Positive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getEventSeverityIcon = (severity: SecurityEvent['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertOctagon className="h-4 w-4 text-red-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getEventStatusBadge = (status: SecurityEvent['status']) => {
    switch (status) {
      case 'normal':
        return <Badge variant="outline">Normal</Badge>;
      case 'suspicious':
        return <Badge variant="secondary">Suspicious</Badge>;
      case 'blocked':
        return <Badge variant="destructive">Blocked</Badge>;
      case 'investigating':
        return <Badge variant="secondary">Investigating</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const startSecurityScan = async () => {
    setIsScanning(true);
    
    // Simulate security scan
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Update metrics with new scan results
    setMetrics(prev => ({
      ...prev,
      lastScanTime: new Date(),
      nextScanTime: new Date(Date.now() + 7200000), // 2 hours from now
      securityScore: Math.min(100, prev.securityScore + Math.random() * 5)
    }));
    
    setIsScanning(false);
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
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
          <Typography variant="display" className="text-gray-900">Threat Detection</Typography>
          <Typography variant="body" className="text-gray-600">
            AI-powered security monitoring and threat detection system
          </Typography>
        </div>
        <div className="flex space-x-3">
          <AppleButton variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </AppleButton>
          <AppleButton variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Security Settings
          </AppleButton>
          <AppleButton 
            onClick={startSecurityScan}
            disabled={isScanning}
          >
            {isScanning ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Scan className="h-4 w-4 mr-2" />
            )}
            {isScanning ? 'Scanning...' : 'Security Scan'}
          </AppleButton>
        </div>
      </motion.div>

      {/* Security Metrics */}
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
            <Typography variant="display" className="text-3xl font-light text-gray-900 mb-2">
              {metrics.securityScore.toFixed(1)}
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Security Score</Typography>
            <Progress value={metrics.securityScore} className="h-2" />
            <Typography variant="small" className={`${getSecurityScoreColor(metrics.securityScore)} mt-2`}>
              {metrics.securityScore >= 90 ? 'Excellent' : metrics.securityScore >= 70 ? 'Good' : metrics.securityScore >= 50 ? 'Fair' : 'Poor'}
            </Typography>
          </div>
        </FrostedCard>

        <FrostedCard className="hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <TrendingDown className="h-5 w-5 text-green-500" />
            </div>
            <Typography variant="display" className="text-3xl font-light text-gray-900 mb-2">
              {metrics.activeThreats}
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Active Threats</Typography>
            <Progress value={(metrics.activeThreats / Math.max(metrics.totalThreats, 1)) * 100} className="h-2" />
            <Typography variant="small" className="text-orange-600 mt-2">
              {metrics.activeThreats} currently active
            </Typography>
          </div>
        </FrostedCard>

        <FrostedCard className="hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Clock className="h-8 w-8 text-purple-600" />
              <TrendingDown className="h-5 w-5 text-green-500" />
            </div>
            <Typography variant="display" className="text-3xl font-light text-gray-900 mb-2">
              {formatDuration(metrics.avgResponseTime)}
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Avg Response Time</Typography>
            <Progress value={75} className="h-2" />
            <Typography variant="small" className="text-purple-600 mt-2">
              Per threat response
            </Typography>
          </div>
        </FrostedCard>

        <FrostedCard className="hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Target className="h-8 w-8 text-green-600" />
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <Typography variant="display" className="text-3xl font-light text-gray-900 mb-2">
              {metrics.threatDetectionRate.toFixed(1)}%
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Detection Rate</Typography>
            <Progress value={metrics.threatDetectionRate} className="h-2" />
            <Typography variant="small" className="text-green-600 mt-2">
              Threats detected successfully
            </Typography>
          </div>
        </FrostedCard>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="flex space-x-1 p-1 bg-gray-100 rounded-2xl">
          {[
            { id: 'overview', name: 'Overview', icon: <Shield className="h-4 w-4" /> },
            { id: 'threats', name: 'Active Threats', icon: <AlertTriangle className="h-4 w-4" /> },
            { id: 'events', name: 'Security Events', icon: <Activity className="h-4 w-4" /> },
            { id: 'ai-analysis', name: 'AI Analysis', icon: <Brain className="h-4 w-4" /> }
          ].map((tab) => (
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
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Security Status */}
            <FrostedCard>
              <div className="p-6">
                <Typography variant="heading3" className="text-gray-900 mb-4">
                  Security Status Overview
                </Typography>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <ShieldCheck className="h-6 w-6 text-green-600" />
                      <Typography variant="heading4" className="text-gray-900">
                        Protected Systems
                      </Typography>
                    </div>
                    <Typography variant="display" className="text-2xl font-light text-green-600">
                      {metrics.totalThreats - metrics.activeThreats}
                    </Typography>
                    <Typography variant="small" className="text-gray-500">
                      Systems currently secure
                    </Typography>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <ShieldX className="h-6 w-6 text-red-600" />
                      <Typography variant="heading4" className="text-gray-900">
                        Vulnerabilities
                      </Typography>
                    </div>
                    <Typography variant="display" className="text-2xl font-light text-red-600">
                      {metrics.systemVulnerabilities}
                    </Typography>
                    <Typography variant="small" className="text-gray-500">
                      Known vulnerabilities
                    </Typography>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Clock className="h-6 w-6 text-blue-600" />
                      <Typography variant="heading4" className="text-gray-900">
                        Last Scan
                      </Typography>
                    </div>
                    <Typography variant="display" className="text-2xl font-light text-blue-600">
                      {formatDate(metrics.lastScanTime)}
                    </Typography>
                    <Typography variant="small" className="text-gray-500">
                      Security scan completed
                    </Typography>
                  </div>
                </div>
              </div>
            </FrostedCard>

            {/* Threat Distribution */}
            <FrostedCard>
              <div className="p-6">
                <Typography variant="heading3" className="text-gray-900 mb-4">
                  Threat Distribution
                </Typography>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Typography variant="label" className="text-gray-700">
                      Active Threats
                    </Typography>
                    <div className="flex items-center space-x-2">
                      <Progress value={(metrics.activeThreats / Math.max(metrics.totalThreats, 1)) * 100} className="w-32 h-2" />
                      <Typography variant="small" className="text-gray-500">
                        {metrics.activeThreats} threats
                      </Typography>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Typography variant="label" className="text-gray-700">
                      Contained Threats
                    </Typography>
                    <div className="flex items-center space-x-2">
                      <Progress value={(metrics.containedThreats / Math.max(metrics.totalThreats, 1)) * 100} className="w-32 h-2" />
                      <Typography variant="small" className="text-gray-500">
                        {metrics.containedThreats} threats
                      </Typography>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Typography variant="label" className="text-gray-700">
                      Resolved Threats
                    </Typography>
                    <div className="flex items-center space-x-2">
                      <Progress value={(metrics.resolvedThreats / Math.max(metrics.totalThreats, 1)) * 100} className="w-32 h-2" />
                      <Typography variant="small" className="text-gray-500">
                        {metrics.resolvedThreats} threats
                      </Typography>
                    </div>
                  </div>
                </div>
              </div>
            </FrostedCard>
          </div>
        )}

        {activeTab === 'threats' && (
          <div className="space-y-4">
            <Typography variant="heading3" className="text-gray-900 mb-4">
              Active Security Threats
            </Typography>
            
            {threats.map((threat, index) => (
              <motion.div
                key={threat.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <FrostedCard className="hover:shadow-lg transition-all duration-200">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 mt-1">
                          {getThreatTypeIcon(threat.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <Typography variant="heading4" className="text-gray-900">
                              {threat.title}
                            </Typography>
                            {getSeverityBadge(threat.severity)}
                            {getStatusBadge(threat.status)}
                          </div>
                          
                          <Typography variant="body" className="text-gray-600 mb-3">
                            {threat.description}
                          </Typography>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                            <div>
                              <span className="text-gray-500">Source: </span>
                              <span className="font-medium">{threat.source}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Target: </span>
                              <span className="font-medium">{threat.target}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Confidence: </span>
                              <span className="font-medium">{threat.confidence}%</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Risk Score: </span>
                              <span className="font-medium">{threat.riskScore}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="bg-blue-50 p-3 rounded-xl border border-blue-200">
                              <Typography variant="label" className="text-blue-800 mb-1">
                                AI Analysis:
                              </Typography>
                              <Typography variant="small" className="text-blue-700">
                                {threat.aiAnalysis}
                              </Typography>
                            </div>
                            
                            <div className="bg-green-50 p-3 rounded-xl border border-green-200">
                              <Typography variant="label" className="text-green-800 mb-1">
                                Recommended Actions:
                              </Typography>
                              <ul className="list-disc list-inside text-sm text-green-700">
                                {threat.recommendedActions.map((action, idx) => (
                                  <li key={idx}>{action}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </FrostedCard>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-4">
            <Typography variant="heading3" className="text-gray-900 mb-4">
              Recent Security Events
            </Typography>
            
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <FrostedCard className="hover:shadow-lg transition-all duration-200">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {getEventSeverityIcon(event.severity)}
                        <div>
                          <Typography variant="heading4" className="text-gray-900">
                            {event.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Typography>
                          <Typography variant="small" className="text-gray-500">
                            {event.description}
                          </Typography>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getEventStatusBadge(event.status)}
                        <Badge variant="outline">Risk: {event.riskScore}</Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">User: </span>
                        <span className="font-medium">{event.user}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">IP Address: </span>
                        <span className="font-medium font-mono">{event.ipAddress}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Location: </span>
                        <span className="font-medium">{event.location}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Time: </span>
                        <span className="font-medium">{formatDate(event.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </FrostedCard>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'ai-analysis' && (
          <div className="space-y-4">
            <Typography variant="heading3" className="text-gray-900 mb-4">
              AI-Powered Security Analysis
            </Typography>
            
            <FrostedCard>
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Brain className="h-8 w-8 text-blue-600" />
                  <Typography variant="heading4" className="text-gray-900">
                    Machine Learning Threat Detection
                  </Typography>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <Typography variant="label" className="text-blue-800 mb-2">
                      AI Capabilities:
                    </Typography>
                    <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                      <li>Behavioral anomaly detection using machine learning</li>
                      <li>Pattern recognition for known attack signatures</li>
                      <li>Predictive threat modeling and risk assessment</li>
                      <li>Automated response recommendations</li>
                      <li>Continuous learning from security events</li>
                    </ul>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                    <Typography variant="label" className="text-green-800 mb-2">
                      Current AI Performance:
                    </Typography>
                    <div className="grid grid-cols-2 gap-4 text-sm text-green-700">
                      <div>
                        <span>Detection Accuracy: </span>
                        <span className="font-medium">94.2%</span>
                      </div>
                      <div>
                        <span>False Positive Rate: </span>
                        <span className="font-medium">2.1%</span>
                      </div>
                      <div>
                        <span>Response Time: </span>
                        <span className="font-medium">1.8s</span>
                      </div>
                      <div>
                        <span>Learning Rate: </span>
                        <span className="font-medium">+5.2%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </FrostedCard>
          </div>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Typography variant="heading2" className="mb-6 text-gray-900">
          Quick Actions
        </Typography>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FrostedCard className="hover:shadow-xl transition-all duration-300">
            <div className="p-6 text-center">
              <Scan className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <Typography variant="heading4" className="text-gray-900 mb-2">
                Security Scan
              </Typography>
              <Typography variant="body" className="text-gray-600 mb-4">
                Run comprehensive security analysis
              </Typography>
              <AppleButton variant="outline" size="sm">
                <Scan className="h-4 w-4 mr-2" />
                Start Scan
              </AppleButton>
            </div>
          </FrostedCard>

          <FrostedCard className="hover:shadow-xl transition-all duration-300">
            <div className="p-6 text-center">
              <Shield className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <Typography variant="heading4" className="text-gray-900 mb-2">
                Threat Response
              </Typography>
              <Typography variant="body" className="text-gray-600 mb-4">
                Manage active security threats
              </Typography>
              <AppleButton variant="outline" size="sm">
                <Shield className="h-4 w-4 mr-2" />
                View Threats
              </AppleButton>
            </div>
          </FrostedCard>

          <FrostedCard className="hover:shadow-xl transition-all duration-300">
            <div className="p-6 text-center">
              <Settings className="h-16 w-16 text-purple-600 mx-auto mb-4" />
              <Typography variant="heading4" className="text-gray-900 mb-2">
                Security Config
              </Typography>
              <Typography variant="body" className="text-gray-600 mb-4">
                Configure security settings
              </Typography>
              <AppleButton variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </AppleButton>
            </div>
          </FrostedCard>
        </div>
      </motion.div>
    </div>
  );
}
