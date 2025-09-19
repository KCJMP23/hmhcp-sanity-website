'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Eye, 
  MousePointer, 
  Clock, 
  Target,
  Brain,
  Zap,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Info,
  Download,
  RefreshCw,
  Filter,
  Calendar,
  PieChart,
  LineChart,
  Activity,
  Globe,
  Smartphone,
  Monitor,
  ArrowUp,
  ArrowDown,
  Minus,
  Settings
} from 'lucide-react';
import { FrostedCard } from '@/components/ui/frosted-card';
import { Typography } from '@/components/ui/apple-typography';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LiquidGlassButton } from '@/components/ui/liquid-glass-button';

interface AnalyticsMetrics {
  totalVisitors: number;
  uniqueVisitors: number;
  pageViews: number;
  avgSessionDuration: number;
  bounceRate: number;
  conversionRate: number;
  topTrafficSource: string;
  topPage: string;
  mobileTraffic: number;
  desktopTraffic: number;
  tabletTraffic: number;
  organicSearch: number;
  directTraffic: number;
  socialMedia: number;
  referralTraffic: number;
}

interface UserBehavior {
  id: string;
  pattern: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  recommendation: string;
  category: 'navigation' | 'content' | 'conversion' | 'performance';
  status: 'active' | 'investigating' | 'resolved';
}

interface AITrend {
  id: string;
  metric: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  change: number;
  confidence: number;
  insight: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
}

export default function AdvancedAnalytics() {
  const [metrics, setMetrics] = useState<AnalyticsMetrics>({
    totalVisitors: 0,
    uniqueVisitors: 0,
    pageViews: 0,
    avgSessionDuration: 0,
    bounceRate: 0,
    conversionRate: 0,
    topTrafficSource: '',
    topPage: '',
    mobileTraffic: 0,
    desktopTraffic: 0,
    tabletTraffic: 0,
    organicSearch: 0,
    directTraffic: 0,
    socialMedia: 0,
    referralTraffic: 0
  });

  const [userBehaviors, setUserBehaviors] = useState<UserBehavior[]>([]);
  const [aiTrends, setAiTrends] = useState<AITrend[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for demonstration
  useEffect(() => {
    const mockMetrics: AnalyticsMetrics = {
      totalVisitors: 15420,
      uniqueVisitors: 8920,
      pageViews: 45680,
      avgSessionDuration: 245,
      bounceRate: 32.4,
      conversionRate: 4.8,
      topTrafficSource: 'Organic Search',
      topPage: '/services/healthcare-consulting',
      mobileTraffic: 58.2,
      desktopTraffic: 38.7,
      tabletTraffic: 3.1,
      organicSearch: 45.3,
      directTraffic: 28.7,
      socialMedia: 18.2,
      referralTraffic: 7.8
    };

    const mockBehaviors: UserBehavior[] = [
      {
        id: '1',
        pattern: 'High bounce rate on service pages',
        description: 'Users are leaving service pages within 10 seconds',
        impact: 'high',
        confidence: 87,
        recommendation: 'Improve page load speed and add engaging content above the fold',
        category: 'performance',
        status: 'active'
      },
      {
        id: '2',
        pattern: 'Mobile users prefer contact forms',
        description: 'Mobile conversion rate is 40% higher on contact pages',
        impact: 'medium',
        confidence: 92,
        recommendation: 'Optimize contact forms for mobile and add more CTAs',
        category: 'conversion',
        status: 'investigating'
      },
      {
        id: '3',
        pattern: 'Evening traffic peak',
        description: 'Peak traffic occurs between 7-9 PM EST',
        impact: 'low',
        confidence: 78,
        recommendation: 'Schedule content updates and social media posts during peak hours',
        category: 'content',
        status: 'resolved'
      }
    ];

    const mockTrends: AITrend[] = [
      {
        id: '1',
        metric: 'Mobile Conversion Rate',
        trend: 'increasing',
        change: 12.4,
        confidence: 94,
        insight: 'Mobile optimization efforts are showing positive results',
        action: 'Continue mobile-first design improvements',
        priority: 'high'
      },
      {
        id: '2',
        metric: 'Organic Search Traffic',
        trend: 'decreasing',
        change: -8.2,
        confidence: 89,
        insight: 'SEO performance has declined over the last 30 days',
        action: 'Review and update content strategy, check for technical SEO issues',
        priority: 'high'
      },
      {
        id: '3',
        metric: 'Page Load Speed',
        trend: 'stable',
        change: 0.3,
        confidence: 76,
        insight: 'Performance optimizations are maintaining current levels',
        action: 'Continue monitoring and implement additional optimizations',
        priority: 'medium'
      }
    ];

    setMetrics(mockMetrics);
    setUserBehaviors(mockBehaviors);
    setAiTrends(mockTrends);
  }, []);

  const getImpactColor = (impact: UserBehavior['impact']) => {
    switch (impact) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getImpactBadge = (impact: UserBehavior['impact']) => {
    switch (impact) {
      case 'high':
        return <Badge variant="destructive">High Impact</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium Impact</Badge>;
      case 'low':
        return <Badge variant="outline">Low Impact</Badge>;
      default:
        return <Badge variant="outline">{impact}</Badge>;
    }
  };

  const getStatusBadge = (status: UserBehavior['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'investigating':
        return <Badge variant="secondary">Investigating</Badge>;
      case 'resolved':
        return <Badge variant="outline">Resolved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTrendIcon = (trend: AITrend['trend']) => {
    switch (trend) {
      case 'increasing':
        return <ArrowUp className="h-4 w-4 text-green-600" />;
      case 'decreasing':
        return <ArrowDown className="h-4 w-4 text-red-600" />;
      case 'stable':
        return <Minus className="h-4 w-4 text-gray-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: AITrend['trend']) => {
    switch (trend) {
      case 'increasing':
        return 'text-green-600';
      case 'decreasing':
        return 'text-red-600';
      case 'stable':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const getPriorityBadge = (priority: AITrend['priority']) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High Priority</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium Priority</Badge>;
      case 'low':
        return <Badge variant="outline">Low Priority</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const startAIAnalysis = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Update AI trends with new insights
    setAiTrends(prev => prev.map(trend => ({
      ...trend,
      confidence: Math.min(100, trend.confidence + Math.random() * 5),
      change: trend.change + (Math.random() - 0.5) * 2
    })));
    
    setIsAnalyzing(false);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
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
          <Typography variant="display" className="text-gray-900">Advanced Analytics</Typography>
          <Typography variant="body" className="text-gray-600">
            AI-powered insights and advanced user behavior analysis
          </Typography>
        </div>
        <div className="flex space-x-3">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <LiquidGlassButton variant="secondary-light" size="md">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </LiquidGlassButton>
          <LiquidGlassButton 
            variant="primary"
            size="md"
            onClick={startAIAnalysis}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Brain className="h-4 w-4 mr-2" />
            )}
            {isAnalyzing ? 'Analyzing...' : 'AI Analysis'}
          </LiquidGlassButton>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <FrostedCard className="hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="h-8 w-8 text-blue-600" />
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <Typography variant="display" className="text-3xl font-light text-gray-900 mb-2">
              {formatNumber(metrics.totalVisitors)}
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Total Visitors</Typography>
            <Progress value={75} className="h-2" />
            <Typography variant="small" className="text-blue-600 mt-2">
              +12.4% from last period
            </Typography>
          </div>
        </FrostedCard>

        <FrostedCard className="hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Eye className="h-8 w-8 text-green-600" />
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <Typography variant="display" className="text-3xl font-light text-gray-900 mb-2">
              {formatNumber(metrics.pageViews)}
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Page Views</Typography>
            <Progress value={68} className="h-2" />
            <Typography variant="small" className="text-green-600 mt-2">
              +8.7% from last period
            </Typography>
          </div>
        </FrostedCard>

        <FrostedCard className="hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Clock className="h-8 w-8 text-purple-600" />
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <Typography variant="display" className="text-3xl font-light text-gray-900 mb-2">
              {formatDuration(metrics.avgSessionDuration)}
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Avg Session</Typography>
            <Progress value={82} className="h-2" />
            <Typography variant="small" className="text-purple-600 mt-2">
              +5.2% from last period
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
              {metrics.conversionRate.toFixed(1)}%
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Conversion Rate</Typography>
            <Progress value={metrics.conversionRate * 10} className="h-2" />
            <Typography variant="small" className="text-orange-600 mt-2">
              +2.1% from last period
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
            { id: 'overview', name: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
            { id: 'behavior', name: 'User Behavior', icon: <Users className="h-4 w-4" /> },
            { id: 'ai-insights', name: 'AI Insights', icon: <Brain className="h-4 w-4" /> },
            { id: 'traffic', name: 'Traffic Sources', icon: <Globe className="h-4 w-4" /> }
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
            {/* Traffic Overview */}
            <FrostedCard>
              <div className="p-6">
                <Typography variant="heading3" className="text-gray-900 mb-4">
                  Traffic Overview
                </Typography>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Smartphone className="h-6 w-6 text-blue-600" />
                      <Typography variant="heading4" className="text-gray-900">
                        Mobile
                      </Typography>
                    </div>
                    <Typography variant="display" className="text-2xl font-light text-blue-600">
                      {metrics.mobileTraffic.toFixed(1)}%
                    </Typography>
                    <Typography variant="small" className="text-gray-500">
                      Mobile traffic share
                    </Typography>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Monitor className="h-6 w-6 text-green-600" />
                      <Typography variant="heading4" className="text-gray-900">
                        Desktop
                      </Typography>
                    </div>
                    <Typography variant="display" className="text-2xl font-light text-green-600">
                      {metrics.desktopTraffic.toFixed(1)}%
                    </Typography>
                    <Typography variant="small" className="text-gray-500">
                      Desktop traffic share
                    </Typography>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Activity className="h-6 w-6 text-purple-600" />
                      <Typography variant="heading4" className="text-gray-900">
                        Engagement
                      </Typography>
                    </div>
                    <Typography variant="display" className="text-2xl font-light text-purple-600">
                      {formatDuration(metrics.avgSessionDuration)}
                    </Typography>
                    <Typography variant="small" className="text-gray-500">
                      Average session duration
                    </Typography>
                  </div>
                </div>
              </div>
            </FrostedCard>

            {/* Performance Metrics */}
            <FrostedCard>
              <div className="p-6">
                <Typography variant="heading3" className="text-gray-900 mb-4">
                  Performance Metrics
                </Typography>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Typography variant="label" className="text-gray-700">
                      Bounce Rate
                    </Typography>
                    <div className="flex items-center space-x-2">
                      <Progress value={100 - metrics.bounceRate} className="w-32 h-2" />
                      <Typography variant="small" className="text-gray-500">
                        {metrics.bounceRate.toFixed(1)}%
                      </Typography>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Typography variant="label" className="text-gray-700">
                      Conversion Rate
                    </Typography>
                    <div className="flex items-center space-x-2">
                      <Progress value={metrics.conversionRate * 10} className="w-32 h-2" />
                      <Typography variant="small" className="text-gray-500">
                        {metrics.conversionRate.toFixed(1)}%
                      </Typography>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Typography variant="label" className="text-gray-700">
                      Page Views per Session
                    </Typography>
                    <div className="flex items-center space-x-2">
                      <Progress value={75} className="w-32 h-2" />
                      <Typography variant="small" className="text-gray-500">
                        {(metrics.pageViews / metrics.totalVisitors).toFixed(1)}
                      </Typography>
                    </div>
                  </div>
                </div>
              </div>
            </FrostedCard>
          </div>
        )}

        {activeTab === 'behavior' && (
          <div className="space-y-4">
            <Typography variant="heading3" className="text-gray-900 mb-4">
              User Behavior Patterns
            </Typography>
            
            {userBehaviors.map((behavior, index) => (
              <motion.div
                key={behavior.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <FrostedCard className="hover:shadow-lg transition-all duration-200">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Typography variant="heading4" className="text-gray-900">
                            {behavior.pattern}
                          </Typography>
                          {getImpactBadge(behavior.impact)}
                          {getStatusBadge(behavior.status)}
                        </div>
                        
                        <Typography variant="body" className="text-gray-600 mb-3">
                          {behavior.description}
                        </Typography>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <span>Confidence: {behavior.confidence}%</span>
                          <span>Category: {behavior.category}</span>
                        </div>
                        
                        <div className="bg-blue-50 p-3 rounded-xl border border-blue-200">
                          <Typography variant="label" className="text-blue-800 mb-1">
                            AI Recommendation:
                          </Typography>
                          <Typography variant="small" className="text-blue-700">
                            {behavior.recommendation}
                          </Typography>
                        </div>
                      </div>
                    </div>
                  </div>
                </FrostedCard>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'ai-insights' && (
          <div className="space-y-4">
            <Typography variant="heading3" className="text-gray-900 mb-4">
              AI-Powered Insights
            </Typography>
            
            {aiTrends.map((trend, index) => (
              <motion.div
                key={trend.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <FrostedCard className="hover:shadow-lg transition-all duration-200">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Typography variant="heading4" className="text-gray-900">
                            {trend.metric}
                          </Typography>
                          {getTrendIcon(trend.trend)}
                          <span className={`font-medium ${getTrendColor(trend.trend)}`}>
                            {trend.change > 0 ? '+' : ''}{trend.change.toFixed(1)}%
                          </span>
                          {getPriorityBadge(trend.priority)}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <span>Confidence: {trend.confidence.toFixed(1)}%</span>
                          <span>Trend: {trend.trend}</span>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="bg-green-50 p-3 rounded-xl border border-green-200">
                            <Typography variant="label" className="text-green-800 mb-1">
                              AI Insight:
                            </Typography>
                            <Typography variant="small" className="text-green-700">
                              {trend.insight}
                            </Typography>
                          </div>
                          
                          <div className="bg-blue-50 p-3 rounded-xl border border-blue-200">
                            <Typography variant="label" className="text-blue-800 mb-1">
                              Recommended Action:
                            </Typography>
                            <Typography variant="small" className="text-blue-700">
                              {trend.action}
                            </Typography>
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

        {activeTab === 'traffic' && (
          <div className="space-y-4">
            <Typography variant="heading3" className="text-gray-900 mb-4">
              Traffic Sources Analysis
            </Typography>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FrostedCard>
                <div className="p-6">
                  <Typography variant="heading4" className="text-gray-900 mb-4">
                    Traffic Distribution
                  </Typography>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                        <span className="text-sm text-gray-700">Organic Search</span>
                      </div>
                      <span className="font-medium">{metrics.organicSearch.toFixed(1)}%</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                        <span className="text-sm text-gray-700">Direct Traffic</span>
                      </div>
                      <span className="font-medium">{metrics.directTraffic.toFixed(1)}%</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                        <span className="text-sm text-gray-700">Social Media</span>
                      </div>
                      <span className="font-medium">{metrics.socialMedia.toFixed(1)}%</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
                        <span className="text-sm text-gray-700">Referral</span>
                      </div>
                      <span className="font-medium">{metrics.referralTraffic.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </FrostedCard>

              <FrostedCard>
                <div className="p-6">
                  <Typography variant="heading4" className="text-gray-900 mb-4">
                    Device Distribution
                  </Typography>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Smartphone className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-gray-700">Mobile</span>
                      </div>
                      <span className="font-medium">{metrics.mobileTraffic.toFixed(1)}%</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Monitor className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-gray-700">Desktop</span>
                      </div>
                      <span className="font-medium">{metrics.desktopTraffic.toFixed(1)}%</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Activity className="h-4 w-4 text-purple-600" />
                        <span className="text-sm text-gray-700">Tablet</span>
                      </div>
                      <span className="font-medium">{metrics.tabletTraffic.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </FrostedCard>
            </div>
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
              <Brain className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <Typography variant="heading4" className="text-gray-900 mb-2">
                AI Analysis
              </Typography>
              <Typography variant="body" className="text-gray-600 mb-4">
                Generate AI-powered insights and recommendations
              </Typography>
              <LiquidGlassButton variant="secondary-light" size="sm">
                <Brain className="h-4 w-4 mr-2" />
                Run Analysis
              </LiquidGlassButton>
            </div>
          </FrostedCard>

          <FrostedCard className="hover:shadow-xl transition-all duration-300">
            <div className="p-6 text-center">
              <Download className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <Typography variant="heading4" className="text-gray-900 mb-2">
                Export Reports
              </Typography>
              <Typography variant="body" className="text-gray-600 mb-4">
                Generate comprehensive analytics reports
              </Typography>
              <LiquidGlassButton variant="secondary-light" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </LiquidGlassButton>
            </div>
          </FrostedCard>

          <FrostedCard className="hover:shadow-xl transition-all duration-300">
            <div className="p-6 text-center">
              <Settings className="h-16 w-16 text-purple-600 mx-auto mb-4" />
              <Typography variant="heading4" className="text-gray-900 mb-2">
                Analytics Settings
              </Typography>
              <Typography variant="body" className="text-gray-600 mb-4">
                Configure tracking and analysis preferences
              </Typography>
              <LiquidGlassButton variant="secondary-light" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </LiquidGlassButton>
            </div>
          </FrostedCard>
        </div>
      </motion.div>
    </div>
  );
}
