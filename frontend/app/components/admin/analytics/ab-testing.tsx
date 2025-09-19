'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TestTube, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Target, 
  BarChart3, 
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
  Plus,
  Edit,
  Trash2,
  Eye,
  Zap,
  Activity,
  ArrowUp,
  ArrowDown,
  Minus,
  Percent,
  Timer,
  Users2,
  MousePointer,
  FileText,
  DollarSign
} from 'lucide-react';
import { FrostedCard } from '@/components/ui/frosted-card';
import { Typography } from '@/components/ui/apple-typography';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AppleButton } from '@/components/ui/apple-button';

interface ABTest {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'stopped';
  type: 'page' | 'component' | 'content' | 'design' | 'pricing';
  startDate: Date;
  endDate?: Date;
  trafficSplit: number;
  variants: TestVariant[];
  metrics: TestMetrics;
  confidence: number;
  winner?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface TestVariant {
  id: string;
  name: string;
  description: string;
  traffic: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  avgOrderValue: number;
  bounceRate: number;
  avgSessionDuration: number;
}

interface TestMetrics {
  totalVisitors: number;
  totalConversions: number;
  overallConversionRate: number;
  totalRevenue: number;
  statisticalSignificance: number;
  pValue: number;
  confidenceInterval: number;
}

export default function ABTesting() {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const mockTests: ABTest[] = [
      {
        id: '1',
        name: 'Homepage Hero CTA Test',
        description: 'Testing different call-to-action buttons on the homepage hero section',
        status: 'running',
        type: 'component',
        startDate: new Date(Date.now() - 86400000 * 7), // 7 days ago
        trafficSplit: 50,
        variants: [
          {
            id: 'v1',
            name: 'Control - "Learn More"',
            description: 'Original blue button with "Learn More" text',
            traffic: 1250,
            conversions: 89,
            conversionRate: 7.12,
            revenue: 4450,
            avgOrderValue: 50.00,
            bounceRate: 32.4,
            avgSessionDuration: 245
          },
          {
            id: 'v2',
            name: 'Variant A - "Get Started"',
            description: 'Green button with "Get Started" text',
            traffic: 1280,
            conversions: 102,
            conversionRate: 7.97,
            revenue: 5100,
            avgOrderValue: 50.00,
            bounceRate: 29.8,
            avgSessionDuration: 268
          }
        ],
        metrics: {
          totalVisitors: 2530,
          totalConversions: 191,
          overallConversionRate: 7.55,
          totalRevenue: 9550,
          statisticalSignificance: 85.2,
          pValue: 0.048,
          confidenceInterval: 95
        },
        confidence: 85.2,
        priority: 'high'
      },
      {
        id: '2',
        name: 'Pricing Page Layout Test',
        description: 'Testing different pricing table layouts and presentation',
        status: 'completed',
        type: 'page',
        startDate: new Date(Date.now() - 86400000 * 14), // 14 days ago
        endDate: new Date(Date.now() - 86400000 * 2), // 2 days ago
        trafficSplit: 50,
        variants: [
          {
            id: 'v1',
            name: 'Control - Horizontal Layout',
            description: 'Original horizontal pricing table',
            traffic: 890,
            conversions: 45,
            conversionRate: 5.06,
            revenue: 2250,
            avgOrderValue: 50.00,
            bounceRate: 28.7,
            avgSessionDuration: 189
          },
          {
            id: 'v2',
            name: 'Variant A - Vertical Layout',
            description: 'New vertical pricing cards',
            traffic: 920,
            conversions: 67,
            conversionRate: 7.28,
            revenue: 3350,
            avgOrderValue: 50.00,
            bounceRate: 24.2,
            avgSessionDuration: 234
          }
        ],
        metrics: {
          totalVisitors: 1810,
          totalConversions: 112,
          overallConversionRate: 6.19,
          totalRevenue: 5600,
          statisticalSignificance: 92.1,
          pValue: 0.032,
          confidenceInterval: 95
        },
        confidence: 92.1,
        winner: 'v2',
        priority: 'medium'
      },
      {
        id: '3',
        name: 'Email Subject Line Test',
        description: 'Testing different email subject lines for newsletter signup',
        status: 'draft',
        type: 'content',
        startDate: new Date(),
        trafficSplit: 50,
        variants: [
          {
            id: 'v1',
            name: 'Control - "Stay Updated"',
            description: 'Original subject line',
            traffic: 0,
            conversions: 0,
            conversionRate: 0,
            revenue: 0,
            avgOrderValue: 0,
            bounceRate: 0,
            avgSessionDuration: 0
          },
          {
            id: 'v2',
            name: 'Variant A - "Exclusive Insights"',
            description: 'New compelling subject line',
            traffic: 0,
            conversions: 0,
            conversionRate: 0,
            revenue: 0,
            avgOrderValue: 0,
            bounceRate: 0,
            avgSessionDuration: 0
          }
        ],
        metrics: {
          totalVisitors: 0,
          totalConversions: 0,
          overallConversionRate: 0,
          totalRevenue: 0,
          statisticalSignificance: 0,
          pValue: 0,
          confidenceInterval: 95
        },
        confidence: 0,
        priority: 'low'
      }
    ];

    setTests(mockTests);
  }, []);

  const getStatusBadge = (status: ABTest['status']) => {
    switch (status) {
      case 'running':
        return <Badge variant="default">Running</Badge>;
      case 'completed':
        return <Badge variant="outline">Completed</Badge>;
      case 'paused':
        return <Badge variant="secondary">Paused</Badge>;
      case 'stopped':
        return <Badge variant="destructive">Stopped</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: ABTest['type']) => {
    switch (type) {
      case 'page':
        return <Eye className="h-5 w-5 text-blue-600" />;
      case 'component':
        return <Target className="h-5 w-5 text-green-600" />;
      case 'content':
        return <FileText className="h-5 w-5 text-purple-600" />;
      case 'design':
        return <Activity className="h-5 w-5 text-orange-600" />;
      case 'pricing':
        return <DollarSign className="h-5 w-5 text-red-600" />;
      default:
        return <TestTube className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPriorityBadge = (priority: ABTest['priority']) => {
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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 95) return 'text-green-600';
    if (confidence >= 90) return 'text-blue-600';
    if (confidence >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const startTest = (testId: string) => {
    setTests(prev => prev.map(test => 
      test.id === testId ? { ...test, status: 'running' as const } : test
    ));
  };

  const pauseTest = (testId: string) => {
    setTests(prev => prev.map(test => 
      test.id === testId ? { ...test, status: 'paused' as const } : test
    ));
  };

  const stopTest = (testId: string) => {
    setTests(prev => prev.map(test => 
      test.id === testId ? { ...test, status: 'stopped' as const } : test
    ));
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
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
          <Typography variant="display" className="text-gray-900">A/B Testing</Typography>
          <Typography variant="body" className="text-gray-600">
            Create, manage, and analyze A/B tests for optimization
          </Typography>
        </div>
        <div className="flex space-x-3">
          <AppleButton variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Results
          </AppleButton>
          <AppleButton onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Test
          </AppleButton>
        </div>
      </motion.div>

      {/* Test Statistics */}
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
              {tests.length}
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Total Tests</Typography>
            <Progress value={100} className="h-2" />
            <Typography variant="small" className="text-blue-600 mt-2">
              All tests configured
            </Typography>
          </div>
        </FrostedCard>

        <FrostedCard className="hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Play className="h-8 w-8 text-green-600" />
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <Typography variant="display" className="text-3xl font-light text-gray-900 mb-2">
              {tests.filter(t => t.status === 'running').length}
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Active Tests</Typography>
            <Progress value={(tests.filter(t => t.status === 'running').length / tests.length) * 100} className="h-2" />
            <Typography variant="small" className="text-green-600 mt-2">
              Currently running
            </Typography>
          </div>
        </FrostedCard>

        <FrostedCard className="hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="h-8 w-8 text-purple-600" />
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <Typography variant="display" className="text-3xl font-light text-gray-900 mb-2">
              {tests.filter(t => t.status === 'completed').length}
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Completed Tests</Typography>
            <Progress value={(tests.filter(t => t.status === 'completed').length / tests.length) * 100} className="h-2" />
            <Typography variant="small" className="text-purple-600 mt-2">
              Tests finished
            </Typography>
          </div>
        </FrostedCard>

        <FrostedCard className="hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Target className="h-8 w-8 text-orange-600" />
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <Typography variant="display" className="text-3xl font-light text-gray-900 mb-2">
              {tests.filter(t => t.winner).length}
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Winners Found</Typography>
            <Progress value={(tests.filter(t => t.winner).length / tests.filter(t => t.status === 'completed').length) * 100} className="h-2" />
            <Typography variant="small" className="text-orange-600 mt-2">
              Clear winners identified
            </Typography>
          </div>
        </FrostedCard>
      </motion.div>

      {/* A/B Tests List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Typography variant="heading2" className="mb-6 text-gray-900">
          A/B Tests
        </Typography>
        <div className="space-y-4">
          {tests.map((test, index) => (
            <motion.div
              key={test.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <FrostedCard className="hover:shadow-lg transition-all duration-200">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 mt-1">
                        {getTypeIcon(test.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <Typography variant="heading4" className="text-gray-900">
                            {test.name}
                          </Typography>
                          {getStatusBadge(test.status)}
                          {getPriorityBadge(test.priority)}
                        </div>
                        
                        <Typography variant="body" className="text-gray-600 mb-3">
                          {test.description}
                        </Typography>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                          <div>
                            <span className="text-gray-500">Start Date: </span>
                            <span className="font-medium">{formatDate(test.startDate)}</span>
                          </div>
                          {test.endDate && (
                            <div>
                              <span className="text-gray-500">End Date: </span>
                              <span className="font-medium">{formatDate(test.endDate)}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-500">Traffic Split: </span>
                            <span className="font-medium">{test.trafficSplit}%</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Variants: </span>
                            <span className="font-medium">{test.variants.length}</span>
                          </div>
                        </div>
                        
                        {test.status === 'running' && (
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                            <span>Total Visitors: {test.metrics.totalVisitors.toLocaleString()}</span>
                            <span>Conversions: {test.metrics.totalConversions.toLocaleString()}</span>
                            <span>Overall Rate: {test.metrics.overallConversionRate.toFixed(2)}%</span>
                            <span className={`font-medium ${getConfidenceColor(test.confidence)}`}>
                              Confidence: {test.confidence.toFixed(1)}%
                            </span>
                          </div>
                        )}
                        
                        {test.winner && (
                          <div className="bg-green-50 p-3 rounded-xl border border-green-200">
                            <Typography variant="label" className="text-green-800 mb-1">
                              🏆 Winner Identified:
                            </Typography>
                            <Typography variant="small" className="text-green-700">
                              {test.variants.find(v => v.id === test.winner)?.name}
                            </Typography>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      {test.status === 'draft' && (
                        <AppleButton
                          variant="outline"
                          size="sm"
                          onClick={() => startTest(test.id)}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Start Test
                        </AppleButton>
                      )}
                      
                      {test.status === 'running' && (
                        <>
                          <AppleButton
                            variant="outline"
                            size="sm"
                            onClick={() => pauseTest(test.id)}
                          >
                            <Pause className="h-4 w-4 mr-2" />
                            Pause
                          </AppleButton>
                          <AppleButton
                            variant="outline"
                            size="sm"
                            onClick={() => stopTest(test.id)}
                          >
                            <Square className="h-4 w-4 mr-2" />
                            Stop
                          </AppleButton>
                        </>
                      )}
                      
                      {test.status === 'paused' && (
                        <AppleButton
                          variant="outline"
                          size="sm"
                          onClick={() => startTest(test.id)}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Resume
                        </AppleButton>
                      )}
                      
                      <AppleButton
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTest(test.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </AppleButton>
                    </div>
                  </div>
                  
                  {/* Variants Summary */}
                  {test.status !== 'draft' && (
                    <div className="mt-4 pt-4 border-t border-gray-200/50">
                      <Typography variant="label" className="text-gray-700 mb-3">
                        Variants Performance:
                      </Typography>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {test.variants.map((variant) => (
                          <div key={variant.id} className="bg-gray-50 p-3 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                              <Typography variant="small" className="font-medium text-gray-900">
                                {variant.name}
                              </Typography>
                              {test.winner === variant.id && (
                                <Badge variant="default">Winner</Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                              <div>
                                <span>Traffic: </span>
                                <span className="font-medium">{variant.traffic.toLocaleString()}</span>
                              </div>
                              <div>
                                <span>Rate: </span>
                                <span className="font-medium">{variant.conversionRate.toFixed(2)}%</span>
                              </div>
                              <div>
                                <span>Conversions: </span>
                                <span className="font-medium">{variant.conversions.toLocaleString()}</span>
                              </div>
                              <div>
                                <span>Revenue: </span>
                                <span className="font-medium">${variant.revenue.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </FrostedCard>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Typography variant="heading2" className="mb-6 text-gray-900">
          Quick Actions
        </Typography>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FrostedCard className="hover:shadow-xl transition-all duration-300">
            <div className="p-6 text-center">
              <Plus className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <Typography variant="heading4" className="text-gray-900 mb-2">
                Create New Test
              </Typography>
              <Typography variant="body" className="text-gray-600 mb-4">
                Set up a new A/B test with multiple variants
              </Typography>
              <AppleButton variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Test
              </AppleButton>
            </div>
          </FrostedCard>

          <FrostedCard className="hover:shadow-xl transition-all duration-300">
            <div className="p-6 text-center">
              <BarChart3 className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <Typography variant="heading4" className="text-gray-900 mb-2">
                View Results
              </Typography>
              <Typography variant="body" className="text-gray-600 mb-4">
                Analyze test results and statistical significance
              </Typography>
              <AppleButton variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Results
              </AppleButton>
            </div>
          </FrostedCard>

          <FrostedCard className="hover:shadow-xl transition-all duration-300">
            <div className="p-6 text-center">
              <Settings className="h-16 w-16 text-purple-600 mx-auto mb-4" />
              <Typography variant="heading4" className="text-gray-900 mb-2">
                Test Settings
              </Typography>
              <Typography variant="body" className="text-gray-600 mb-4">
                Configure testing parameters and thresholds
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
