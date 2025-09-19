'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HealthcareAILogger } from '@/lib/utils/healthcare-ai-logger';

const logger = new HealthcareAILogger('SchedulingDashboard');

interface QueueStatus {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  failedJobs: number;
  nextScheduledJob: string;
  queueHealth: 'healthy' | 'warning' | 'critical';
}

interface ActiveJob {
  id: string;
  postId: string;
  title: string;
  scheduledAt: string;
  status: 'processing' | 'waiting';
  startedAt?: string;
  progress: number;
}

interface FailedJob {
  id: string;
  postId: string;
  title: string;
  scheduledAt: string;
  status: 'failed';
  failedAt: string;
  errorMessage: string;
  retryCount: number;
}

export function SchedulingDashboard() {
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [failedJobs, setFailedJobs] = useState<FailedJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchQueueStatus();
    
    if (autoRefresh) {
      const interval = setInterval(fetchQueueStatus, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchQueueStatus = async () => {
    try {
      logger.info('Fetching publishing queue status');
      
      const response = await fetch('/api/admin/content/blog/publish-queue');
      const data = await response.json();
      
      if (data.success) {
        setQueueStatus(data.queueStatus);
        setActiveJobs(data.activeJobs);
        setFailedJobs(data.failedJobs);
        logger.info('Queue status fetched successfully', { 
          totalJobs: data.queueStatus.totalJobs,
          activeJobs: data.queueStatus.activeJobs 
        });
      } else {
        throw new Error(data.message || 'Failed to fetch queue status');
      }
    } catch (error) {
      logger.error('Failed to fetch queue status', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQueueAction = async (action: string, jobId: string, postId?: string) => {
    try {
      logger.info('Processing queue action', { action, jobId, postId });
      
      const response = await fetch('/api/admin/content/blog/publish-queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, jobId, postId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        logger.info('Queue action completed successfully', { action, jobId });
        fetchQueueStatus(); // Refresh the status
      } else {
        throw new Error(data.message || 'Failed to process queue action');
      }
    } catch (error) {
      logger.error('Failed to process queue action', { 
        action, 
        jobId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'text-blue-600 bg-blue-100';
      case 'waiting':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading scheduling dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Publishing Queue Dashboard</h2>
          <p className="text-sm text-gray-600">
            Monitor and manage your blog post publishing queue
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-600">Auto-refresh</span>
          </label>
          <button
            onClick={fetchQueueStatus}
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Queue Status Overview */}
      {queueStatus && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Jobs</p>
                <p className="text-2xl font-semibold text-gray-900">{queueStatus.totalJobs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Jobs</p>
                <p className="text-2xl font-semibold text-gray-900">{queueStatus.activeJobs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">{queueStatus.completedJobs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getHealthColor(queueStatus.queueHealth)}`}>
                  {queueStatus.queueHealth}
                </span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Queue Health</p>
                <p className="text-sm text-gray-900">
                  Next: {formatDateTime(queueStatus.nextScheduledJob)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Jobs */}
      {activeJobs.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Active Jobs</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {activeJobs.map((job) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">{job.title}</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Scheduled for:</span>
                        <p>{formatDateTime(job.scheduledAt)}</p>
                      </div>
                      <div>
                        <span className="font-medium">Progress:</span>
                        <div className="mt-1">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${job.progress}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{job.progress}% complete</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleQueueAction('cancel', job.id)}
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Failed Jobs */}
      {failedJobs.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Failed Jobs</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {failedJobs.map((job) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">{job.title}</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <span className="font-medium">Scheduled for:</span>
                        <p>{formatDateTime(job.scheduledAt)}</p>
                      </div>
                      <div>
                        <span className="font-medium">Failed at:</span>
                        <p>{formatDateTime(job.failedAt)}</p>
                      </div>
                    </div>

                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-800">
                        <strong>Error:</strong> {job.errorMessage}
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        Retry count: {job.retryCount}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleQueueAction('retry', job.id)}
                      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                    >
                      Retry
                    </button>
                    <button
                      onClick={() => handleQueueAction('publish_now', job.id, job.postId)}
                      className="px-3 py-1 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                    >
                      Publish Now
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {activeJobs.length === 0 && failedJobs.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No active jobs</h3>
          <p className="mt-1 text-sm text-gray-500">
            All scheduled posts have been processed successfully.
          </p>
        </div>
      )}
    </div>
  );
}
