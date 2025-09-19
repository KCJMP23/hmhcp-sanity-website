'use client';

import React, { useState, useEffect } from 'react';
import { useCoreIntegration } from '@/hooks/use-core-integration';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  FileText, 
  Brain, 
  Zap, 
  TrendingUp, 
  Clock, 
  DollarSign,
  BarChart3,
  Play,
  Pause,
  Settings,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react';
import { FrostedCard } from '@/components/ui/frosted-card';
import { Typography } from '@/components/ui/apple-typography';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LiquidGlassButton } from '@/components/ui/liquid-glass-button';

export default function AIGenerationDashboard() {
  const { aiContent, analytics, systemMonitoring } = useCoreIntegration();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [activeGenerations, setActiveGenerations] = useState(0);

  // Mock data for demonstration
  const [stats] = useState({
    totalGenerations: 1247,
    successfulGenerations: 1189,
    failedGenerations: 58,
    totalTokens: 456789,
    totalCost: 234.56,
    averageQuality: 4.2,
    thisMonth: 89,
    lastMonth: 76
  });

  const [templates] = useState([
    {
      id: '1',
      name: 'Healthcare Blog Post',
      description: 'Professional healthcare content with medical accuracy',
      content_type: 'blog_post',
      is_default: true,
      usage_count: 342,
      success_rate: 98.5,
      avg_tokens: 450
    },
    {
      id: '2',
      name: 'Patient Education',
      description: 'Clear, accessible patient information materials',
      content_type: 'patient_education',
      is_default: false,
      usage_count: 156,
      success_rate: 95.2,
      avg_tokens: 320
    },
    {
      id: '3',
      name: 'Medical Newsletter',
      description: 'Professional medical industry updates',
      content_type: 'newsletter',
      is_default: false,
      usage_count: 89,
      success_rate: 97.8,
      avg_tokens: 280
    },
    {
      id: '4',
      name: 'Social Media Post',
      description: 'Engaging healthcare social media content',
      content_type: 'social_media',
      is_default: false,
      usage_count: 234,
      success_rate: 99.1,
      avg_tokens: 150
    }
  ]);

  const [recentGenerations] = useState([
    { id: 1, title: 'Healthcare Innovation Trends 2024', template: 'Healthcare Blog Post', status: 'completed', quality: 4.5, tokens: 456, cost: 0.23, time: '2 minutes ago' },
    { id: 2, title: 'Patient Care Guidelines', template: 'Patient Education', status: 'completed', quality: 4.2, tokens: 320, cost: 0.16, time: '5 minutes ago' },
    { id: 3, title: 'Monthly Health Tips', template: 'Social Media Post', status: 'completed', quality: 4.8, tokens: 150, cost: 0.08, time: '8 minutes ago' },
    { id: 4, title: 'Medical Research Update', template: 'Medical Newsletter', status: 'processing', quality: 0, tokens: 0, cost: 0, time: '1 minute ago' }
  ]);

  useEffect(() => {
    // Track page view
    analytics.trackPageView('/admin/ai-generation');
    analytics.trackEvent('ai_generation_dashboard_viewed', { section: 'ai_generation' });
  }, [analytics]);

  const handleGenerateContent = async (templateId: string) => {
    setIsGenerating(true);
    setActiveGenerations(prev => prev + 1);
    
    // Simulate generation process
    for (let i = 0; i <= 100; i += 10) {
      setGenerationProgress(i);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    setIsGenerating(false);
    setActiveGenerations(prev => prev - 1);
    setGenerationProgress(0);
    
    // Log generation
    await systemMonitoring.logMetric('ai_content_generated', 1, 'admin');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Sparkles className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'failed':
        return <Zap className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
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
          <Typography variant="display" className="text-gray-900">AI Content Generation</Typography>
          <Typography variant="body" className="text-gray-600">
            Create professional healthcare content using AI-powered templates and advanced language models
          </Typography>
        </div>
        <div className="flex space-x-3">
          <LiquidGlassButton variant="secondary-light" size="md">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </LiquidGlassButton>
          <LiquidGlassButton variant="primary" size="md">
            <Sparkles className="h-4 w-4 mr-2" />
            New Generation
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
              <Sparkles className="h-8 w-8 text-purple-600" />
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <Typography variant="display" className="text-3xl font-light text-gray-900 mb-2">
              {stats.totalGenerations.toLocaleString()}
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Total Generations</Typography>
            <Progress value={75} className="h-2" />
            <Typography variant="small" className="text-purple-600 mt-2">
              +{stats.thisMonth} this month
            </Typography>
          </div>
        </FrostedCard>

        <FrostedCard className="hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Brain className="h-8 w-8 text-blue-600" />
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <Typography variant="display" className="text-3xl font-light text-gray-900 mb-2">
              {stats.averageQuality.toFixed(1)}
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Average Quality</Typography>
            <Progress value={stats.averageQuality * 20} className="h-2" />
            <Typography variant="small" className="text-blue-600 mt-2">
              Out of 5.0 rating
            </Typography>
          </div>
        </FrostedCard>

        <FrostedCard className="hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="h-8 w-8 text-green-600" />
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <Typography variant="display" className="text-3xl font-light text-gray-900 mb-2">
              ${stats.totalCost.toFixed(2)}
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Total Cost</Typography>
            <Progress value={45} className="h-2" />
            <Typography variant="small" className="text-green-600 mt-2">
              ${(stats.totalCost / 12).toFixed(2)} avg/month
            </Typography>
          </div>
        </FrostedCard>

        <FrostedCard className="hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="h-8 w-8 text-orange-600" />
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <Typography variant="display" className="text-3xl font-light text-gray-900 mb-2">
              {stats.totalTokens.toLocaleString()}
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Total Tokens</Typography>
            <Progress value={60} className="h-2" />
            <Typography variant="small" className="text-orange-600 mt-2">
              {Math.round(stats.totalTokens / stats.totalGenerations)} avg/generation
            </Typography>
          </div>
        </FrostedCard>
      </motion.div>

      {/* Content Templates */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Typography variant="heading2" className="mb-6 text-gray-900">
          Content Templates
        </Typography>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {templates.map((template) => (
            <motion.div
              key={template.id}
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <FrostedCard className="hover:shadow-xl transition-all duration-300">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <FileText className="h-6 w-6 text-blue-600" />
                        <Typography variant="heading4" className="text-gray-900">
                          {template.name}
                        </Typography>
                        {template.is_default && (
                          <Badge variant="default">Default</Badge>
                        )}
                      </div>
                      <Typography variant="body" className="text-gray-600 mb-4">
                        {template.description}
                      </Typography>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-3 bg-blue-50 rounded-xl">
                      <Typography variant="display" className="text-xl font-light text-blue-600">
                        {template.usage_count}
                      </Typography>
                      <Typography variant="small" className="text-blue-600">Uses</Typography>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-xl">
                      <Typography variant="display" className="text-xl font-light text-green-600">
                        {template.success_rate}%
                      </Typography>
                      <Typography variant="small" className="text-green-600">Success</Typography>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <LiquidGlassButton 
                      variant="primary"
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleGenerateContent(template.id)}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Generate
                    </LiquidGlassButton>
                    <LiquidGlassButton variant="secondary-light" size="sm">
                      <Settings className="h-4 w-4" />
                    </LiquidGlassButton>
                  </div>
                </div>
              </FrostedCard>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Generation Progress */}
      {isGenerating && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <FrostedCard className="border-blue-200 bg-blue-50/50">
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Brain className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <Typography variant="heading4" className="text-gray-900">
                    Generating Content...
                  </Typography>
                  <Typography variant="small" className="text-gray-600">
                    AI is creating your content. This may take a few moments.
                  </Typography>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{generationProgress}%</span>
                </div>
                <Progress value={generationProgress} className="h-3" />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Active Generations: {activeGenerations}</span>
                  <span>Estimated time: 2-3 minutes</span>
                </div>
              </div>
            </div>
          </FrostedCard>
        </motion.div>
      )}

      {/* Recent Generations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Typography variant="heading2" className="mb-6 text-gray-900">
          Recent Generations
        </Typography>
        <FrostedCard>
          <div className="p-6">
            <div className="space-y-4">
              {recentGenerations.map((generation) => (
                <div key={generation.id} className="flex items-center justify-between p-4 border border-gray-200/50 rounded-2xl bg-white/50 backdrop-blur-sm">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(generation.status)}
                    <div>
                      <Typography variant="label" className="text-gray-900">
                        {generation.title}
                      </Typography>
                      <Typography variant="small" className="text-gray-600">
                        {generation.template} • {generation.time}
                      </Typography>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <Typography variant="small" className="text-gray-600">
                          Quality: {generation.quality > 0 ? generation.quality.toFixed(1) : 'N/A'}
                        </Typography>
                        <Typography variant="small" className="text-gray-600">
                          Tokens: {generation.tokens}
                        </Typography>
                        <Typography variant="small" className="text-gray-600">
                          Cost: ${generation.cost.toFixed(2)}
                        </Typography>
                      </div>
                    </div>
                    <Badge className={getStatusColor(generation.status)}>
                      {generation.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FrostedCard>
      </motion.div>

      {/* AI Model Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <FrostedCard>
          <div className="p-6">
            <Typography variant="heading3" className="mb-6 text-gray-900">
              AI Model Information
            </Typography>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-2xl">
                <Brain className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <Typography variant="heading4" className="text-gray-900 mb-2">
                  GPT-4
                </Typography>
                <Typography variant="small" className="text-gray-600">
                  Advanced language model for high-quality content
                </Typography>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-2xl">
                <Zap className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <Typography variant="heading4" className="text-gray-900 mb-2">
                  Fast Processing
                </Typography>
                <Typography variant="small" className="text-gray-600">
                  Optimized for healthcare content generation
                </Typography>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-2xl">
                <Settings className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                <Typography variant="heading4" className="text-gray-900 mb-2">
                  Custom Training
                </Typography>
                <Typography variant="small" className="text-gray-600">
                  Fine-tuned for medical accuracy
                </Typography>
              </div>
            </div>
          </div>
        </FrostedCard>
      </motion.div>
    </div>
  );
}

