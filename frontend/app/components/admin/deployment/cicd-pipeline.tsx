'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GitBranch, 
  Play, 
  Pause, 
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
  ArrowUp,
  ArrowDown,
  Minus,
  GitCommit,
  GitPullRequest,
  GitMerge,
  Cloud,
  Server,
  Database,
  Globe,
  Shield,
  Activity,
  Square
} from 'lucide-react';
import { FrostedCard } from '@/components/ui/frosted-card';
import { Typography } from '@/components/ui/apple-typography';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AppleButton } from '@/components/ui/apple-button';

interface Pipeline {
  id: string;
  name: string;
  description: string;
  status: 'idle' | 'running' | 'success' | 'failed' | 'cancelled';
  branch: string;
  commit: string;
  author: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  stages: PipelineStage[];
  environment: 'development' | 'staging' | 'production';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface PipelineStage {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  duration: number;
  logs: string[];
  artifacts: string[];
}

interface DeploymentMetrics {
  totalDeployments: number;
  successfulDeployments: number;
  failedDeployments: number;
  avgDeploymentTime: number;
  deploymentFrequency: number;
  leadTime: number;
  recoveryTime: number;
  availability: number;
}

export default function CICDPipeline() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [metrics, setMetrics] = useState<DeploymentMetrics>({
    totalDeployments: 0,
    successfulDeployments: 0,
    failedDeployments: 0,
    avgDeploymentTime: 0,
    deploymentFrequency: 0,
    leadTime: 0,
    recoveryTime: 0,
    availability: 0
  });
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const mockPipelines: Pipeline[] = [
      {
        id: '1',
        name: 'Feature: User Authentication',
        description: 'Deploy new user authentication system with OAuth integration',
        status: 'running',
        branch: 'feature/user-auth',
        commit: 'a1b2c3d4',
        author: 'john.doe@hmhcp.com',
        startTime: new Date(Date.now() - 1800000), // 30 minutes ago
        duration: 1800,
        environment: 'staging',
        priority: 'high',
        stages: [
          {
            id: 's1',
            name: 'Build',
            status: 'success',
            duration: 300,
            logs: ['Building application...', 'Dependencies installed', 'Build successful'],
            artifacts: ['app.tar.gz', 'docker-image.tar']
          },
          {
            id: 's2',
            name: 'Test',
            status: 'success',
            duration: 600,
            logs: ['Running unit tests...', 'Running integration tests...', 'All tests passed'],
            artifacts: ['test-results.xml', 'coverage-report.html']
          },
          {
            id: 's3',
            name: 'Deploy to Staging',
            status: 'running',
            duration: 900,
            logs: ['Deploying to staging environment...', 'Database migrations running...'],
            artifacts: []
          },
          {
            id: 's4',
            name: 'Integration Tests',
            status: 'pending',
            duration: 0,
            logs: [],
            artifacts: []
          }
        ]
      },
      {
        id: '2',
        name: 'Hotfix: Security Patch',
        description: 'Critical security vulnerability fix',
        status: 'success',
        branch: 'hotfix/security-patch',
        commit: 'e5f6g7h8',
        author: 'security@hmhcp.com',
        startTime: new Date(Date.now() - 3600000), // 1 hour ago
        endTime: new Date(Date.now() - 3000000), // 50 minutes ago
        duration: 600,
        environment: 'production',
        priority: 'critical',
        stages: [
          {
            id: 's1',
            name: 'Build',
            status: 'success',
            duration: 120,
            logs: ['Building security patch...', 'Build successful'],
            artifacts: ['security-patch.tar.gz']
          },
          {
            id: 's2',
            name: 'Security Scan',
            status: 'success',
            duration: 180,
            logs: ['Running security scan...', 'No vulnerabilities found'],
            artifacts: ['security-scan-report.pdf']
          },
          {
            id: 's3',
            name: 'Deploy to Production',
            status: 'success',
            duration: 300,
            logs: ['Deploying to production...', 'Deployment successful'],
            artifacts: []
          }
        ]
      },
      {
        id: '3',
        name: 'Release: v2.1.0',
        description: 'Major feature release with performance improvements',
        status: 'idle',
        branch: 'release/v2.1.0',
        commit: 'i9j0k1l2',
        author: 'release@hmhcp.com',
        startTime: new Date(),
        duration: 0,
        environment: 'staging',
        priority: 'medium',
        stages: [
          {
            id: 's1',
            name: 'Build',
            status: 'pending',
            duration: 0,
            logs: [],
            artifacts: []
          },
          {
            id: 's2',
            name: 'Test',
            status: 'pending',
            duration: 0,
            logs: [],
            artifacts: []
          },
          {
            id: 's3',
            name: 'Deploy to Staging',
            status: 'pending',
            duration: 0,
            logs: [],
            artifacts: []
          }
        ]
      }
    ];

    const mockMetrics: DeploymentMetrics = {
      totalDeployments: 156,
      successfulDeployments: 148,
      failedDeployments: 8,
      avgDeploymentTime: 1200,
      deploymentFrequency: 2.3,
      leadTime: 86400,
      recoveryTime: 1800,
      availability: 99.87
    };

    setPipelines(mockPipelines);
    setMetrics(mockMetrics);
  }, []);

  const getStatusBadge = (status: Pipeline['status']) => {
    switch (status) {
      case 'running':
        return <Badge variant="default">Running</Badge>;
      case 'success':
        return <Badge variant="outline">Success</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>;
      case 'idle':
        return <Badge variant="outline">Idle</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStageStatusIcon = (status: PipelineStage['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-600" />;
      case 'skipped':
        return <Minus className="h-4 w-4 text-gray-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getEnvironmentIcon = (environment: Pipeline['environment']) => {
    switch (environment) {
      case 'development':
        return <Code className="h-5 w-5 text-blue-600" />;
      case 'staging':
        return <Server className="h-5 w-5 text-yellow-600" />;
      case 'production':
        return <Cloud className="h-5 w-5 text-green-600" />;
      default:
        return <Server className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPriorityBadge = (priority: Pipeline['priority']) => {
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

  const startPipeline = async (pipelineId: string) => {
    setIsDeploying(true);
    
    // Simulate pipeline start
    setPipelines(prev => prev.map(p => 
      p.id === pipelineId ? { ...p, status: 'running' as const, startTime: new Date() } : p
    ));
    
    // Simulate pipeline execution
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    setPipelines(prev => prev.map(p => 
      p.id === pipelineId ? { ...p, status: 'success' as const, endTime: new Date() } : p
    ));
    
    setIsDeploying(false);
  };

  const stopPipeline = (pipelineId: string) => {
    setPipelines(prev => prev.map(p => 
      p.id === pipelineId ? { ...p, status: 'cancelled' as const, endTime: new Date() } : p
    ));
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

  const getSuccessRate = () => {
    return (metrics.successfulDeployments / metrics.totalDeployments) * 100;
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
          <Typography variant="display" className="text-gray-900">CI/CD Pipeline</Typography>
          <Typography variant="body" className="text-gray-600">
            Continuous integration and deployment pipeline management
          </Typography>
        </div>
        <div className="flex space-x-3">
          <AppleButton variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </AppleButton>
          <AppleButton variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Pipeline Settings
          </AppleButton>
          <AppleButton>
            <Play className="h-4 w-4 mr-2" />
            New Deployment
          </AppleButton>
        </div>
      </motion.div>

      {/* Deployment Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <FrostedCard className="hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <GitBranch className="h-8 w-8 text-blue-600" />
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <Typography variant="display" className="text-3xl font-light text-gray-900 mb-2">
              {metrics.totalDeployments}
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Total Deployments</Typography>
            <Progress value={100} className="h-2" />
            <Typography variant="small" className="text-blue-600 mt-2">
              All deployments tracked
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
              {getSuccessRate().toFixed(1)}%
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Success Rate</Typography>
            <Progress value={getSuccessRate()} className="h-2" />
            <Typography variant="small" className="text-green-600 mt-2">
              {metrics.successfulDeployments} successful
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
              {formatDuration(metrics.avgDeploymentTime)}
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Avg Deploy Time</Typography>
            <Progress value={75} className="h-2" />
            <Typography variant="small" className="text-purple-600 mt-2">
              Per deployment
            </Typography>
          </div>
        </FrostedCard>

        <FrostedCard className="hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Shield className="h-8 w-8 text-orange-600" />
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <Typography variant="display" className="text-3xl font-light text-gray-900 mb-2">
              {metrics.availability.toFixed(2)}%
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Uptime</Typography>
            <Progress value={metrics.availability} className="h-2" />
            <Typography variant="small" className="text-orange-600 mt-2">
              System availability
            </Typography>
          </div>
        </FrostedCard>
      </motion.div>

      {/* Pipeline List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Typography variant="heading2" className="mb-6 text-gray-900">
          Active Pipelines
        </Typography>
        <div className="space-y-4">
          {pipelines.map((pipeline, index) => (
            <motion.div
              key={pipeline.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <FrostedCard className="hover:shadow-lg transition-all duration-200">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 mt-1">
                        {getEnvironmentIcon(pipeline.environment)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <Typography variant="heading4" className="text-gray-900">
                            {pipeline.name}
                          </Typography>
                          {getStatusBadge(pipeline.status)}
                          {getPriorityBadge(pipeline.priority)}
                        </div>
                        
                        <Typography variant="body" className="text-gray-600 mb-3">
                          {pipeline.description}
                        </Typography>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                          <div>
                            <span className="text-gray-500">Branch: </span>
                            <span className="font-medium">{pipeline.branch}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Commit: </span>
                            <span className="font-medium font-mono">{pipeline.commit}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Author: </span>
                            <span className="font-medium">{pipeline.author}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Environment: </span>
                            <span className="font-medium capitalize">{pipeline.environment}</span>
                          </div>
                        </div>
                        
                        {pipeline.status === 'running' && (
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                            <span>Started: {formatDate(pipeline.startTime)}</span>
                            <span>Duration: {formatDuration(pipeline.duration)}</span>
                            <span>Status: Running</span>
                          </div>
                        )}
                        
                        {pipeline.status === 'success' && (
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                            <span>Started: {formatDate(pipeline.startTime)}</span>
                            <span>Completed: {formatDate(pipeline.endTime!)}</span>
                            <span>Duration: {formatDuration(pipeline.duration)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      {pipeline.status === 'idle' && (
                        <AppleButton
                          variant="outline"
                          size="sm"
                          onClick={() => startPipeline(pipeline.id)}
                          disabled={isDeploying}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Start
                        </AppleButton>
                      )}
                      
                      {pipeline.status === 'running' && (
                        <AppleButton
                          variant="outline"
                          size="sm"
                          onClick={() => stopPipeline(pipeline.id)}
                        >
                          <Square className="h-4 w-4 mr-2" />
                          Stop
                        </AppleButton>
                      )}
                      
                      <AppleButton
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPipeline(pipeline.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </AppleButton>
                    </div>
                  </div>
                  
                  {/* Pipeline Stages */}
                  <div className="mt-4 pt-4 border-t border-gray-200/50">
                    <Typography variant="label" className="text-gray-700 mb-3">
                      Pipeline Stages:
                    </Typography>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      {pipeline.stages.map((stage) => (
                        <div key={stage.id} className="bg-gray-50 p-3 rounded-xl">
                          <div className="flex items-center space-x-2 mb-2">
                            {getStageStatusIcon(stage.status)}
                            <Typography variant="small" className="font-medium text-gray-900">
                              {stage.name}
                            </Typography>
                          </div>
                          <div className="text-xs text-gray-600">
                            <div>Duration: {formatDuration(stage.duration)}</div>
                            {stage.artifacts.length > 0 && (
                              <div>Artifacts: {stage.artifacts.length}</div>
                            )}
                          </div>
                        </div>
                      ))}
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
              <Play className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <Typography variant="heading4" className="text-gray-900 mb-2">
                New Deployment
              </Typography>
              <Typography variant="body" className="text-gray-600 mb-4">
                Start a new deployment pipeline
              </Typography>
              <AppleButton variant="outline" size="sm">
                <Play className="h-4 w-4 mr-2" />
                Deploy
              </AppleButton>
            </div>
          </FrostedCard>

          <FrostedCard className="hover:shadow-xl transition-all duration-300">
            <div className="p-6 text-center">
              <BarChart3 className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <Typography variant="heading4" className="text-gray-900 mb-2">
                View Metrics
              </Typography>
              <Typography variant="body" className="text-gray-600 mb-4">
                Analyze deployment performance
              </Typography>
              <AppleButton variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Metrics
              </AppleButton>
            </div>
          </FrostedCard>

          <FrostedCard className="hover:shadow-xl transition-all duration-300">
            <div className="p-6 text-center">
              <Settings className="h-16 w-16 text-purple-600 mx-auto mb-4" />
              <Typography variant="heading4" className="text-gray-900 mb-2">
                Pipeline Config
              </Typography>
              <Typography variant="body" className="text-gray-600 mb-4">
                Configure pipeline settings
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
