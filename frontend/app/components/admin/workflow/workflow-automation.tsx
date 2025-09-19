'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Workflow, 
  Play, 
  Pause, 
  Square, 
  Plus, 
  Settings, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  Users,
  FileText,
  Database,
  Zap,
  Calendar,
  BarChart3,
  Filter,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  Copy,
  Eye,
  MoreVertical
} from 'lucide-react';
import { FrostedCard } from '@/components/ui/frosted-card';
import { Typography } from '@/components/ui/apple-typography';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AppleButton } from '@/components/ui/apple-button';

interface Workflow {
  id: string;
  name: string;
  description: string;
  type: 'content' | 'user' | 'system' | 'analytics' | 'security';
  status: 'active' | 'paused' | 'stopped' | 'draft';
  trigger: 'manual' | 'scheduled' | 'event' | 'webhook';
  frequency: string;
  lastRun: Date;
  nextRun: Date;
  successRate: number;
  totalRuns: number;
  avgDuration: number;
  steps: WorkflowStep[];
  isEnabled: boolean;
}

interface WorkflowStep {
  id: string;
  name: string;
  type: 'action' | 'condition' | 'loop' | 'delay';
  status: 'pending' | 'running' | 'completed' | 'failed';
  order: number;
  config: Record<string, any>;
}

export default function WorkflowAutomation() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const mockWorkflows: Workflow[] = [
      {
        id: '1',
        name: 'Content Publishing Pipeline',
        description: 'Automated workflow for publishing and distributing healthcare content',
        type: 'content',
        status: 'active',
        trigger: 'scheduled',
        frequency: 'Daily at 9:00 AM',
        lastRun: new Date(Date.now() - 86400000), // 1 day ago
        nextRun: new Date(Date.now() + 3600000), // 1 hour from now
        successRate: 98.5,
        totalRuns: 156,
        avgDuration: 45,
        isEnabled: true,
        steps: [
          { id: '1-1', name: 'Content Validation', type: 'action', status: 'completed', order: 1, config: {} },
          { id: '1-2', name: 'SEO Optimization', type: 'action', status: 'completed', order: 2, config: {} },
          { id: '1-3', name: 'Social Media Distribution', type: 'action', status: 'completed', order: 3, config: {} }
        ]
      },
      {
        id: '2',
        name: 'User Onboarding Sequence',
        description: 'Automated user onboarding and training workflow',
        type: 'user',
        status: 'active',
        trigger: 'event',
        frequency: 'On user registration',
        lastRun: new Date(Date.now() - 1800000), // 30 minutes ago
        nextRun: new Date(), // Immediate
        successRate: 95.2,
        totalRuns: 89,
        avgDuration: 120,
        isEnabled: true,
        steps: [
          { id: '2-1', name: 'Welcome Email', type: 'action', status: 'completed', order: 1, config: {} },
          { id: '2-2', name: 'Profile Completion Check', type: 'condition', status: 'completed', order: 2, config: {} },
          { id: '2-3', name: 'Training Module Assignment', type: 'action', status: 'running', order: 3, config: {} }
        ]
      },
      {
        id: '3',
        name: 'System Health Monitoring',
        description: 'Continuous monitoring and alerting for system health',
        type: 'system',
        status: 'active',
        trigger: 'scheduled',
        frequency: 'Every 5 minutes',
        lastRun: new Date(Date.now() - 300000), // 5 minutes ago
        nextRun: new Date(Date.now() + 120000), // 2 minutes from now
        successRate: 99.8,
        totalRuns: 1247,
        avgDuration: 8,
        isEnabled: true,
        steps: [
          { id: '3-1', name: 'Health Check', type: 'action', status: 'completed', order: 1, config: {} },
          { id: '3-2', name: 'Alert Generation', type: 'condition', status: 'completed', order: 2, config: {} },
          { id: '3-3', name: 'Notification Dispatch', type: 'action', status: 'completed', order: 3, config: {} }
        ]
      },
      {
        id: '4',
        name: 'Analytics Report Generation',
        description: 'Automated generation and distribution of analytics reports',
        type: 'analytics',
        status: 'paused',
        trigger: 'scheduled',
        frequency: 'Weekly on Monday',
        lastRun: new Date(Date.now() - 604800000), // 1 week ago
        nextRun: new Date(Date.now() + 518400000), // 6 days from now
        successRate: 92.1,
        totalRuns: 23,
        avgDuration: 180,
        isEnabled: false,
        steps: [
          { id: '4-1', name: 'Data Collection', type: 'action', status: 'completed', order: 1, config: {} },
          { id: '4-2', name: 'Report Generation', type: 'action', status: 'completed', order: 2, config: {} },
          { id: '4-3', name: 'Email Distribution', type: 'action', status: 'completed', order: 3, config: {} }
        ]
      },
      {
        id: '5',
        name: 'Security Audit Trail',
        description: 'Automated security logging and audit trail generation',
        type: 'security',
        status: 'active',
        trigger: 'event',
        frequency: 'On security event',
        lastRun: new Date(Date.now() - 600000), // 10 minutes ago
        nextRun: new Date(), // Immediate
        successRate: 100,
        totalRuns: 342,
        avgDuration: 15,
        isEnabled: true,
        steps: [
          { id: '5-1', name: 'Event Capture', type: 'action', status: 'completed', order: 1, config: {} },
          { id: '5-2', name: 'Risk Assessment', type: 'action', status: 'completed', order: 2, config: {} },
          { id: '5-3', name: 'Log Entry Creation', type: 'action', status: 'completed', order: 3, config: {} }
        ]
      }
    ];
    setWorkflows(mockWorkflows);
  }, []);

  const getStatusBadge = (status: Workflow['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
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

  const getTypeIcon = (type: Workflow['type']) => {
    switch (type) {
      case 'content':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'user':
        return <Users className="h-5 w-5 text-green-600" />;
      case 'system':
        return <Settings className="h-5 w-5 text-purple-600" />;
      case 'analytics':
        return <BarChart3 className="h-5 w-5 text-orange-600" />;
      case 'security':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Workflow className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTriggerIcon = (trigger: Workflow['trigger']) => {
    switch (trigger) {
      case 'manual':
        return <Play className="h-4 w-4 text-blue-600" />;
      case 'scheduled':
        return <Clock className="h-4 w-4 text-green-600" />;
      case 'event':
        return <Zap className="h-4 w-4 text-yellow-600" />;
      case 'webhook':
        return <Database className="h-4 w-4 text-purple-600" />;
      default:
        return <Workflow className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const toggleWorkflow = (id: string) => {
    setWorkflows(prev => 
      prev.map(w => w.id === id ? { ...w, isEnabled: !w.isEnabled } : w)
    );
  };

  const pauseWorkflow = (id: string) => {
    setWorkflows(prev => 
      prev.map(w => w.id === id ? { ...w, status: 'paused' as const } : w)
    );
  };

  const stopWorkflow = (id: string) => {
    setWorkflows(prev => 
      prev.map(w => w.id === id ? { ...w, status: 'stopped' as const } : w)
    );
  };

  const runWorkflow = async (id: string) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    
    // Update last run time
    setWorkflows(prev => 
      prev.map(w => w.id === id ? { ...w, lastRun: new Date() } : w)
    );
  };

  const workflowStats = {
    total: workflows.length,
    active: workflows.filter(w => w.status === 'active').length,
    paused: workflows.filter(w => w.status === 'paused').length,
    stopped: workflows.filter(w => w.status === 'stopped').length,
    totalRuns: workflows.reduce((sum, w) => sum + w.totalRuns, 0),
    avgSuccessRate: workflows.reduce((sum, w) => sum + w.successRate, 0) / workflows.length,
    avgDuration: workflows.reduce((sum, w) => sum + w.avgDuration, 0) / workflows.length
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
          <Typography variant="display" className="text-gray-900">Workflow Automation</Typography>
          <Typography variant="body" className="text-gray-600">
            Automate business processes and streamline operations
          </Typography>
        </div>
        <div className="flex space-x-3">
          <AppleButton variant="outline" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Workflow
          </AppleButton>
          <AppleButton variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </AppleButton>
        </div>
      </motion.div>

      {/* Statistics Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <FrostedCard className="hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Workflow className="h-8 w-8 text-blue-600" />
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <Typography variant="display" className="text-3xl font-light text-gray-900 mb-2">
              {workflowStats.total}
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Total Workflows</Typography>
            <Progress value={100} className="h-2" />
            <Typography variant="small" className="text-blue-600 mt-2">
              All workflows configured
            </Typography>
          </div>
        </FrostedCard>

        <FrostedCard className="hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Play className="h-8 w-8 text-green-600" />
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <Typography variant="display" className="text-3xl font-light text-gray-900 mb-2">
              {workflowStats.active}
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Active Workflows</Typography>
            <Progress value={(workflowStats.active / workflowStats.total) * 100} className="h-2" />
            <Typography variant="small" className="text-green-600 mt-2">
              Currently running
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
              {workflowStats.totalRuns}
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Total Executions</Typography>
            <Progress value={75} className="h-2" />
            <Typography variant="small" className="text-purple-600 mt-2">
              All time executions
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
              {workflowStats.avgSuccessRate.toFixed(1)}%
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Success Rate</Typography>
            <Progress value={workflowStats.avgSuccessRate} className="h-2" />
            <Typography variant="small" className="text-green-600 mt-2">
              Average success rate
            </Typography>
          </div>
        </FrostedCard>
      </motion.div>

      {/* Workflows List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Typography variant="heading2" className="mb-6 text-gray-900">
          Active Workflows
        </Typography>
        <div className="space-y-4">
          {workflows.map((workflow, index) => (
            <motion.div
              key={workflow.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <FrostedCard className="hover:shadow-lg transition-all duration-200">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 mt-1">
                        {getTypeIcon(workflow.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <Typography variant="heading4" className="text-gray-900">
                            {workflow.name}
                          </Typography>
                          {getStatusBadge(workflow.status)}
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            {getTriggerIcon(workflow.trigger)}
                            <span className="capitalize">{workflow.trigger}</span>
                          </div>
                        </div>
                        <Typography variant="body" className="text-gray-600 mb-3">
                          {workflow.description}
                        </Typography>
                        
                        {/* Workflow Steps */}
                        <div className="flex items-center space-x-2 mb-3">
                          {workflow.steps.map((step, stepIndex) => (
                            <div
                              key={step.id}
                              className="flex items-center space-x-1"
                            >
                              <div className={`w-2 h-2 rounded-full ${
                                step.status === 'completed' ? 'bg-green-500' :
                                step.status === 'running' ? 'bg-yellow-500' :
                                step.status === 'failed' ? 'bg-red-500' : 'bg-gray-300'
                              }`} />
                              <span className="text-xs text-gray-500">{step.name}</span>
                              {stepIndex < workflow.steps.length - 1 && (
                                <div className="w-4 h-px bg-gray-300" />
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Workflow Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <Typography variant="small" className="text-gray-500 mb-1">
                              Frequency
                            </Typography>
                            <Typography variant="label" className="text-gray-900">
                              {workflow.frequency}
                            </Typography>
                          </div>
                          <div className="text-center">
                            <Typography variant="small" className="text-gray-500 mb-1">
                              Last Run
                            </Typography>
                            <Typography variant="label" className="text-gray-900">
                              {formatDate(workflow.lastRun)}
                            </Typography>
                          </div>
                          <div className="text-center">
                            <Typography variant="small" className="text-gray-500 mb-1">
                              Success Rate
                            </Typography>
                            <Typography variant="label" className={`${getSuccessRateColor(workflow.successRate)}`}>
                              {workflow.successRate}%
                            </Typography>
                          </div>
                          <div className="text-center">
                            <Typography variant="small" className="text-gray-500 mb-1">
                              Avg Duration
                            </Typography>
                            <Typography variant="label" className="text-gray-900">
                              {formatDuration(workflow.avgDuration)}
                            </Typography>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-2 ml-4">
                      <AppleButton
                        variant="outline"
                        size="sm"
                        onClick={() => runWorkflow(workflow.id)}
                        disabled={isLoading}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Run Now
                      </AppleButton>
                      
                      {workflow.status === 'active' && (
                        <AppleButton
                          variant="outline"
                          size="sm"
                          onClick={() => pauseWorkflow(workflow.id)}
                        >
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </AppleButton>
                      )}
                      
                      {workflow.status === 'paused' && (
                        <AppleButton
                          variant="outline"
                          size="sm"
                          onClick={() => toggleWorkflow(workflow.id)}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Resume
                        </AppleButton>
                      )}
                      
                      <AppleButton
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedWorkflow(workflow)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </AppleButton>
                    </div>
                  </div>
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
                Create Workflow
              </Typography>
              <Typography variant="body" className="text-gray-600 mb-4">
                Build a new automated workflow from scratch
              </Typography>
              <AppleButton variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Get Started
              </AppleButton>
            </div>
          </FrostedCard>

          <FrostedCard className="hover:shadow-xl transition-all duration-300">
            <div className="p-6 text-center">
              <Settings className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <Typography variant="heading4" className="text-gray-900 mb-2">
                Workflow Templates
              </Typography>
              <Typography variant="body" className="text-gray-600 mb-4">
                Use pre-built templates for common workflows
              </Typography>
              <AppleButton variant="outline" size="sm">
                <Copy className="h-4 w-4 mr-2" />
                Browse Templates
              </AppleButton>
            </div>
          </FrostedCard>

          <FrostedCard className="hover:shadow-xl transition-all duration-300">
            <div className="p-6 text-center">
              <BarChart3 className="h-16 w-16 text-purple-600 mx-auto mb-4" />
              <Typography variant="heading4" className="text-gray-900 mb-2">
                Performance Analytics
              </Typography>
              <Typography variant="body" className="text-gray-600 mb-4">
                Monitor workflow performance and optimization
              </Typography>
              <AppleButton variant="outline" size="sm">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Analytics
              </AppleButton>
            </div>
          </FrostedCard>
        </div>
      </motion.div>
    </div>
  );
}
