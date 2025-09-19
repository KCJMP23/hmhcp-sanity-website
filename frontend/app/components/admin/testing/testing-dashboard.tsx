'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TestTube, 
  Play, 
  Pause, 
  Square, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock,
  RefreshCw,
  Download,
  Settings,
  BarChart3,
  Zap,
  Eye,
  FileText,
  Code,
  Bug,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Plus,
  Trash2,
  Copy,
  ExternalLink
} from 'lucide-react';
import { FrostedCard } from '@/components/ui/frosted-card';
import { Typography } from '@/components/ui/apple-typography';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AppleButton } from '@/components/ui/apple-button';

interface TestSuite {
  id: string;
  name: string;
  description: string;
  type: 'unit' | 'integration' | 'e2e' | 'performance' | 'accessibility';
  status: 'idle' | 'running' | 'completed' | 'failed';
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  lastRun: Date;
  coverage: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface TestResult {
  id: string;
  name: string;
  suite: string;
  status: 'passed' | 'failed' | 'skipped' | 'running';
  duration: number;
  error?: string;
  stackTrace?: string;
  timestamp: Date;
  browser?: string;
  device?: string;
}

interface TestMetrics {
  totalSuites: number;
  runningSuites: number;
  completedSuites: number;
  failedSuites: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  overallCoverage: number;
  avgDuration: number;
  successRate: number;
}

export default function TestingDashboard() {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [metrics, setMetrics] = useState<TestMetrics>({
    totalSuites: 0,
    runningSuites: 0,
    completedSuites: 0,
    failedSuites: 0,
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    skippedTests: 0,
    overallCoverage: 0,
    avgDuration: 0,
    successRate: 0
  });
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSuite, setSelectedSuite] = useState<string | null>(null);

  // Mock data for demonstration
  useEffect(() => {
    const mockSuites: TestSuite[] = [
      {
        id: '1',
        name: 'Unit Tests - Core Components',
        description: 'Tests for React components and utility functions',
        type: 'unit',
        status: 'completed',
        totalTests: 156,
        passedTests: 152,
        failedTests: 2,
        skippedTests: 2,
        duration: 45,
        lastRun: new Date(Date.now() - 1800000), // 30 minutes ago
        coverage: 94.2,
        priority: 'high'
      },
      {
        id: '2',
        name: 'Integration Tests - API Endpoints',
        description: 'Tests for backend API integration',
        type: 'integration',
        status: 'completed',
        totalTests: 89,
        passedTests: 87,
        failedTests: 1,
        skippedTests: 1,
        duration: 120,
        lastRun: new Date(Date.now() - 3600000), // 1 hour ago
        coverage: 97.8,
        priority: 'high'
      },
      {
        id: '3',
        name: 'E2E Tests - User Workflows',
        description: 'End-to-end user journey testing',
        type: 'e2e',
        status: 'running',
        totalTests: 23,
        passedTests: 18,
        failedTests: 2,
        skippedTests: 0,
        duration: 180,
        lastRun: new Date(),
        coverage: 78.3,
        priority: 'medium'
      },
      {
        id: '4',
        name: 'Performance Tests - Load Testing',
        description: 'Performance and stress testing',
        type: 'performance',
        status: 'idle',
        totalTests: 12,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 12,
        duration: 0,
        lastRun: new Date(Date.now() - 86400000), // 1 day ago
        coverage: 0,
        priority: 'low'
      },
      {
        id: '5',
        name: 'Accessibility Tests - WCAG Compliance',
        description: 'Accessibility and usability testing',
        type: 'accessibility',
        status: 'completed',
        totalTests: 34,
        passedTests: 32,
        failedTests: 2,
        skippedTests: 0,
        duration: 75,
        lastRun: new Date(Date.now() - 7200000), // 2 hours ago
        coverage: 94.1,
        priority: 'medium'
      }
    ];

    const mockResults: TestResult[] = [
      {
        id: '1',
        name: 'should render user profile correctly',
        suite: 'Unit Tests - Core Components',
        status: 'passed',
        duration: 45,
        timestamp: new Date(Date.now() - 1800000)
      },
      {
        id: '2',
        name: 'should handle API errors gracefully',
        suite: 'Integration Tests - API Endpoints',
        status: 'passed',
        duration: 120,
        timestamp: new Date(Date.now() - 3600000)
      },
      {
        id: '3',
        name: 'should complete user registration flow',
        suite: 'E2E Tests - User Workflows',
        status: 'running',
        duration: 45,
        timestamp: new Date()
      },
      {
        id: '4',
        name: 'should validate form inputs',
        suite: 'Unit Tests - Core Components',
        status: 'failed',
        duration: 23,
        error: 'Expected input validation to pass but it failed',
        stackTrace: 'at validateForm (form-utils.ts:45)',
        timestamp: new Date(Date.now() - 1800000)
      }
    ];

    setTestSuites(mockSuites);
    setTestResults(mockResults);

    // Calculate metrics
    const totalSuites = mockSuites.length;
    const runningSuites = mockSuites.filter(s => s.status === 'running').length;
    const completedSuites = mockSuites.filter(s => s.status === 'completed').length;
    const failedSuites = mockSuites.filter(s => s.status === 'failed').length;
    
    const totalTests = mockSuites.reduce((sum, s) => sum + s.totalTests, 0);
    const passedTests = mockSuites.reduce((sum, s) => sum + s.passedTests, 0);
    const failedTests = mockSuites.reduce((sum, s) => sum + s.failedTests, 0);
    const skippedTests = mockSuites.reduce((sum, s) => sum + s.skippedTests, 0);
    
    const overallCoverage = mockSuites.reduce((sum, s) => sum + s.coverage, 0) / totalSuites;
    const avgDuration = mockSuites.reduce((sum, s) => sum + s.duration, 0) / totalSuites;
    const successRate = (passedTests / totalTests) * 100;

    setMetrics({
      totalSuites,
      runningSuites,
      completedSuites,
      failedSuites,
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      overallCoverage,
      avgDuration,
      successRate
    });
  }, []);

  const getStatusBadge = (status: TestSuite['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'running':
        return <Badge variant="secondary">Running</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'idle':
        return <Badge variant="outline">Idle</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: TestSuite['type']) => {
    switch (type) {
      case 'unit':
        return <Code className="h-5 w-5 text-blue-600" />;
      case 'integration':
        return <FileText className="h-5 w-5 text-green-600" />;
      case 'e2e':
        return <Eye className="h-5 w-5 text-purple-600" />;
      case 'performance':
        return <Zap className="h-5 w-5 text-orange-600" />;
      case 'accessibility':
        return <Bug className="h-5 w-5 text-red-600" />;
      default:
        return <TestTube className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPriorityBadge = (priority: TestSuite['priority']) => {
    switch (priority) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'high':
        return <Badge variant="default">High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getResultStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'skipped':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    
    // Simulate test execution
    setTestSuites(prev => prev.map(suite => ({ ...suite, status: 'running' as const })));
    
    // Simulate test completion
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    setTestSuites(prev => prev.map(suite => ({
      ...suite,
      status: 'completed' as const,
      lastRun: new Date(),
      passedTests: Math.floor(Math.random() * suite.totalTests * 0.95) + Math.floor(suite.totalTests * 0.8),
      failedTests: Math.floor(Math.random() * suite.totalTests * 0.1),
      skippedTests: Math.floor(Math.random() * suite.totalTests * 0.05)
    })));
    
    setIsRunning(false);
  };

  const runSuite = async (suiteId: string) => {
    setTestSuites(prev => prev.map(s => 
      s.id === suiteId ? { ...s, status: 'running' as const } : s
    ));
    
    // Simulate suite execution
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setTestSuites(prev => prev.map(s => 
      s.id === suiteId ? {
        ...s,
        status: 'completed' as const,
        lastRun: new Date(),
        passedTests: Math.floor(Math.random() * s.totalTests * 0.95) + Math.floor(s.totalTests * 0.8),
        failedTests: Math.floor(Math.random() * s.totalTests * 0.1),
        skippedTests: Math.floor(Math.random() * s.totalTests * 0.05)
      } : s
    ));
  };

  const stopTests = () => {
    setTestSuites(prev => prev.map(s => ({ ...s, status: 'idle' as const })));
    setIsRunning(false);
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
          <Typography variant="display" className="text-gray-900">Testing Dashboard</Typography>
          <Typography variant="body" className="text-gray-600">
            Comprehensive testing suite management and monitoring
          </Typography>
        </div>
        <div className="flex space-x-3">
          <AppleButton variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Test Settings
          </AppleButton>
          <AppleButton variant="outline" onClick={stopTests} disabled={!isRunning}>
            <Square className="h-4 w-4 mr-2" />
            Stop All
          </AppleButton>
          <AppleButton 
            onClick={runAllTests}
            disabled={isRunning}
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </AppleButton>
        </div>
      </motion.div>

      {/* Test Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <FrostedCard className="hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <TestTube className="h-8 w-8 text-blue-600" />
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <Typography variant="display" className="text-3xl font-light text-gray-900 mb-2">
              {metrics.totalSuites}
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Test Suites</Typography>
            <Progress value={100} className="h-2" />
            <Typography variant="small" className="text-blue-600 mt-2">
              All suites configured
            </Typography>
          </div>
        </FrostedCard>

        <FrostedCard className="hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <Typography variant="display" className="text-3xl font-light text-gray-900 mb-2">
              {metrics.successRate.toFixed(1)}%
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Success Rate</Typography>
            <Progress value={metrics.successRate} className="h-2" />
            <Typography variant="small" className="text-green-600 mt-2">
              Tests passing successfully
            </Typography>
          </div>
        </FrostedCard>

        <FrostedCard className="hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <Typography variant="display" className="text-3xl font-light text-gray-900 mb-2">
              {metrics.overallCoverage.toFixed(1)}%
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Code Coverage</Typography>
            <Progress value={metrics.overallCoverage} className="h-2" />
            <Typography variant="small" className="text-purple-600 mt-2">
              Overall test coverage
            </Typography>
          </div>
        </FrostedCard>

        <FrostedCard className="hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Clock className="h-8 w-8 text-orange-600" />
              <TrendingDown className="h-5 w-5 text-green-500" />
            </div>
            <Typography variant="display" className="text-3xl font-light text-gray-900 mb-2">
              {formatDuration(metrics.avgDuration)}
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Avg Duration</Typography>
            <Progress value={75} className="h-2" />
            <Typography variant="small" className="text-orange-600 mt-2">
              Per test suite
            </Typography>
          </div>
        </FrostedCard>
      </motion.div>

      {/* Test Suites */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Typography variant="heading2" className="mb-6 text-gray-900">
          Test Suites
        </Typography>
        <div className="space-y-4">
          {testSuites.map((suite, index) => (
            <motion.div
              key={suite.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <FrostedCard className="hover:shadow-lg transition-all duration-200">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 mt-1">
                        {getTypeIcon(suite.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <Typography variant="heading4" className="text-gray-900">
                            {suite.name}
                          </Typography>
                          {getStatusBadge(suite.status)}
                          {getPriorityBadge(suite.priority)}
                        </div>
                        <Typography variant="body" className="text-gray-600 mb-3">
                          {suite.description}
                        </Typography>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div>
                            <span className="text-sm text-gray-500">Total: </span>
                            <span className="font-medium">{suite.totalTests}</span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Passed: </span>
                            <span className="font-medium text-green-600">{suite.passedTests}</span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Failed: </span>
                            <span className="font-medium text-red-600">{suite.failedTests}</span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Skipped: </span>
                            <span className="font-medium text-yellow-600">{suite.skippedTests}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Duration: {formatDuration(suite.duration)}</span>
                          <span>Coverage: {suite.coverage.toFixed(1)}%</span>
                          <span>Last run: {formatDate(suite.lastRun)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      {suite.status === 'idle' && (
                        <AppleButton
                          variant="outline"
                          size="sm"
                          onClick={() => runSuite(suite.id)}
                          disabled={isRunning}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Run
                        </AppleButton>
                      )}
                      
                      {suite.status === 'running' && (
                        <AppleButton
                          variant="outline"
                          size="sm"
                          disabled
                        >
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Running
                        </AppleButton>
                      )}
                      
                      <AppleButton
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSuite(suite.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </AppleButton>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <Typography variant="small" className="text-gray-700">
                        Test Progress
                      </Typography>
                      <Typography variant="small" className="text-gray-500">
                        {suite.passedTests + suite.failedTests}/{suite.totalTests} completed
                      </Typography>
                    </div>
                    <Progress 
                      value={((suite.passedTests + suite.failedTests) / suite.totalTests) * 100} 
                      className="h-2" 
                    />
                  </div>
                </div>
              </FrostedCard>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Test Results */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Typography variant="heading2" className="mb-6 text-gray-900">
          Recent Test Results
        </Typography>
        <FrostedCard>
          <div className="p-6">
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 border border-gray-200/50 rounded-xl bg-white/50 backdrop-blur-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    {getResultStatusIcon(result.status)}
                    <div>
                      <Typography variant="label" className="text-gray-900">
                        {result.name}
                      </Typography>
                      <Typography variant="small" className="text-gray-600">
                        {result.suite} • {formatDuration(result.duration)}
                      </Typography>
                      {result.error && (
                        <Typography variant="small" className="text-red-600 mt-1">
                          {result.error}
                        </Typography>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Typography variant="small" className="text-gray-500">
                      {formatDate(result.timestamp)}
                    </Typography>
                    <AppleButton variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </AppleButton>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </FrostedCard>
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
              <Plus className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <Typography variant="heading4" className="text-gray-900 mb-2">
                Create Test Suite
              </Typography>
              <Typography variant="body" className="text-gray-600 mb-4">
                Set up new test suites and configurations
              </Typography>
              <AppleButton variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Suite
              </AppleButton>
            </div>
          </FrostedCard>

          <FrostedCard className="hover:shadow-xl transition-all duration-300">
            <div className="p-6 text-center">
              <Download className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <Typography variant="heading4" className="text-gray-900 mb-2">
                Export Reports
              </Typography>
              <Typography variant="body" className="text-gray-600 mb-4">
                Generate comprehensive test reports
              </Typography>
              <AppleButton variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </AppleButton>
            </div>
          </FrostedCard>

          <FrostedCard className="hover:shadow-xl transition-all duration-300">
            <div className="p-6 text-center">
              <Settings className="h-16 w-16 text-purple-600 mx-auto mb-4" />
              <Typography variant="heading4" className="text-gray-900 mb-2">
                Test Configuration
              </Typography>
              <Typography variant="body" className="text-gray-600 mb-4">
                Configure testing frameworks and settings
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
