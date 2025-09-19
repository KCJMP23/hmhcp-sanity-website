'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  Pause, 
  Square, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Plus,
  Eye,
  Download,
  Filter,
  Search
} from 'lucide-react';
import { ABTest, TestReport, WorkflowVariant } from '@/lib/workflows/ab-testing';

interface ABTestDashboardProps {
  tests: ABTest[];
  reports: Map<string, TestReport>;
  onCreateTest: () => void;
  onStartTest: (testId: string) => void;
  onPauseTest: (testId: string) => void;
  onResumeTest: (testId: string) => void;
  onCompleteTest: (testId: string) => void;
  onViewTest: (testId: string) => void;
  onExportTest: (testId: string) => void;
  onGenerateReport: (testId: string) => void;
}

export function ABTestDashboard({
  tests,
  reports,
  onCreateTest,
  onStartTest,
  onPauseTest,
  onResumeTest,
  onCompleteTest,
  onViewTest,
  onExportTest,
  onGenerateReport
}: ABTestDashboardProps) {
  const [filter, setFilter] = useState<'all' | 'draft' | 'running' | 'paused' | 'completed' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'createdAt' | 'participants'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredTests = tests.filter(test => {
    const matchesFilter = filter === 'all' || test.status === filter;
    const matchesSearch = searchTerm === '' || 
      test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const sortedTests = filteredTests.sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'createdAt':
        comparison = a.createdAt.getTime() - b.createdAt.getTime();
        break;
      case 'participants':
        const aParticipants = getTotalParticipants(a.id);
        const bParticipants = getTotalParticipants(b.id);
        comparison = aParticipants - bParticipants;
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const getTotalParticipants = (testId: string): number => {
    const report = reports.get(testId);
    return report?.totalParticipants || 0;
  };

  const getStatusIcon = (status: ABTest['status']) => {
    switch (status) {
      case 'running':
        return <Play className="h-4 w-4 text-green-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'draft':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: ABTest['status']) => {
    switch (status) {
      case 'running':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'paused':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'completed':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'cancelled':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'draft':
        return 'bg-gray-50 border-gray-200 text-gray-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const formatDuration = (days: number) => {
    if (days < 1) {
      return `${Math.round(days * 24)} hours`;
    } else if (days < 7) {
      return `${days} day${days > 1 ? 's' : ''}`;
    } else {
      const weeks = Math.floor(days / 7);
      const remainingDays = days % 7;
      return `${weeks} week${weeks > 1 ? 's' : ''}${remainingDays > 0 ? ` ${remainingDays} day${remainingDays > 1 ? 's' : ''}` : ''}`;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTestProgress = (test: ABTest) => {
    if (test.status === 'completed') return 100;
    if (test.status === 'draft') return 0;
    
    const now = new Date();
    const elapsed = now.getTime() - test.startDate.getTime();
    const total = test.duration * 24 * 60 * 60 * 1000; // Convert days to milliseconds
    const progress = Math.min((elapsed / total) * 100, 100);
    
    return Math.round(progress);
  };

  const getTestMetrics = (test: ABTest) => {
    const report = reports.get(test.id);
    if (!report) return null;

    const primaryMetric = test.metrics.find(m => m.isPrimary);
    if (!primaryMetric) return null;

    const controlVariant = test.variants.find(v => v.isControl);
    const treatmentVariant = test.variants.find(v => !v.isControl);
    
    if (!controlVariant || !treatmentVariant) return null;

    const controlData = report.variants.find(v => v.id === controlVariant.id);
    const treatmentData = report.variants.find(v => v.id === treatmentVariant.id);
    
    if (!controlData || !treatmentData) return null;

    const lift = ((treatmentData.conversionRate - controlData.conversionRate) / controlData.conversionRate) * 100;
    
    return {
      controlRate: controlData.conversionRate,
      treatmentRate: treatmentData.conversionRate,
      lift,
      confidence: report.summary.confidence
    };
  };

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">A/B Test Dashboard</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {tests.length} tests
              </Badge>
              <Button
                size="sm"
                onClick={onCreateTest}
                variant="default"
              >
                <Plus className="h-4 w-4 mr-1" />
                New Test
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Controls */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  <option value="all">All Tests</option>
                  <option value="draft">Draft</option>
                  <option value="running">Running</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  <option value="createdAt">Created Date</option>
                  <option value="name">Name</option>
                  <option value="status">Status</option>
                  <option value="participants">Participants</option>
                </select>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <Search className="h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search tests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-3 py-1 border rounded-md text-sm"
                />
              </div>
            </div>
          </div>

          {/* Tests List */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {sortedTests.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  {filter === 'all' ? 'No A/B tests found' : `No ${filter} tests found`}
                </div>
              ) : (
                sortedTests.map((test) => {
                  const progress = getTestProgress(test);
                  const metrics = getTestMetrics(test);
                  const report = reports.get(test.id);
                  
                  return (
                    <div
                      key={test.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusIcon(test.status)}
                            <h3 className="text-lg font-semibold">{test.name}</h3>
                            <Badge className={`text-xs ${getStatusColor(test.status)}`}>
                              {test.status.toUpperCase()}
                            </Badge>
                            {test.variants.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {test.variants.length} variants
                              </Badge>
                            )}
                          </div>
                          
                          {test.description && (
                            <p className="text-sm text-gray-600 mb-2">
                              {test.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Created {formatTimestamp(test.createdAt)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Target className="h-4 w-4" />
                              Duration: {formatDuration(test.duration)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {getTotalParticipants(test.id)} participants
                            </div>
                            <div className="flex items-center gap-1">
                              <BarChart3 className="h-4 w-4" />
                              {test.metrics.length} metrics
                            </div>
                          </div>

                          {/* Progress Bar */}
                          {test.status === 'running' && (
                            <div className="mb-2">
                              <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                                <span>Progress</span>
                                <span>{progress}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Metrics Summary */}
                          {metrics && (
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div className="text-center">
                                <div className="font-semibold text-gray-600">Control Rate</div>
                                <div className="text-lg font-bold">
                                  {(metrics.controlRate * 100).toFixed(1)}%
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="font-semibold text-gray-600">Treatment Rate</div>
                                <div className="text-lg font-bold">
                                  {(metrics.treatmentRate * 100).toFixed(1)}%
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="font-semibold text-gray-600">Lift</div>
                                <div className={`text-lg font-bold ${metrics.lift > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {metrics.lift > 0 ? '+' : ''}{metrics.lift.toFixed(1)}%
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Winner */}
                          {report?.summary.winner && (
                            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                              <div className="flex items-center gap-2 text-green-800">
                                <CheckCircle className="h-4 w-4" />
                                <span className="font-semibold">Winner: {report.summary.winner}</span>
                                <span className="text-sm">
                                  ({report.summary.lift > 0 ? '+' : ''}{report.summary.lift.toFixed(1)}% improvement)
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          {test.status === 'draft' && (
                            <Button
                              size="sm"
                              onClick={() => onStartTest(test.id)}
                              variant="default"
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Start
                            </Button>
                          )}
                          
                          {test.status === 'running' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => onPauseTest(test.id)}
                                variant="outline"
                              >
                                <Pause className="h-4 w-4 mr-1" />
                                Pause
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => onCompleteTest(test.id)}
                                variant="outline"
                              >
                                <Square className="h-4 w-4 mr-1" />
                                Complete
                              </Button>
                            </>
                          )}
                          
                          {test.status === 'paused' && (
                            <Button
                              size="sm"
                              onClick={() => onResumeTest(test.id)}
                              variant="default"
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Resume
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            onClick={() => onViewTest(test.id)}
                            variant="outline"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          
                          <Button
                            size="sm"
                            onClick={() => onExportTest(test.id)}
                            variant="outline"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Export
                          </Button>
                          
                          {test.status === 'completed' && !report && (
                            <Button
                              size="sm"
                              onClick={() => onGenerateReport(test.id)}
                              variant="outline"
                            >
                              <BarChart3 className="h-4 w-4 mr-1" />
                              Report
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
