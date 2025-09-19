// Plugin Testing Dashboard Component
// Story 6.2: WordPress-Style Plugin Marketplace & Management

'use client';

import React, { useState, useEffect } from 'react';
import {
  TestTube,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  BarChart3,
  Activity,
  Shield,
  Zap,
  FileText,
  Download,
  RefreshCw,
  Filter,
  Search,
  Plus,
  Settings,
  Eye,
  TrendingUp,
  TrendingDown,
  Target,
  Layers,
  Database,
  Network,
  Lock,
  Unlock
} from 'lucide-react';

interface TestSuite {
  id: string;
  name: string;
  description: string;
  testCount: number;
  categories: string[];
}

interface TestReport {
  id: string;
  suiteId: string;
  status: 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  duration: number;
  results: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    error: number;
    passRate: number;
  };
}

interface TestResult {
  id: string;
  testCaseId: string;
  status: 'passed' | 'failed' | 'skipped' | 'error';
  duration: number;
  message?: string;
  error?: string;
  details?: any;
  timestamp: string;
  retryCount: number;
}

interface TestCoverage {
  lines: {
    total: number;
    covered: number;
    percentage: number;
  };
  functions: {
    total: number;
    covered: number;
    percentage: number;
  };
  branches: {
    total: number;
    covered: number;
    percentage: number;
  };
  statements: {
    total: number;
    covered: number;
    percentage: number;
  };
}

export default function TestingDashboard() {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [testReports, setTestReports] = useState<TestReport[]>([]);
  const [testCoverage, setTestCoverage] = useState<TestCoverage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'suites' | 'reports' | 'coverage' | 'security' | 'performance'>('overview');
  const [filter, setFilter] = useState({
    search: '',
    status: 'all',
    category: 'all'
  });
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadTestingData();
  }, []);

  const loadTestingData = async () => {
    try {
      setLoading(true);
      
      // Load test suites
      const suitesResponse = await fetch('/api/plugins/testing?action=suites');
      const suitesData = await suitesResponse.json();
      setTestSuites(suitesData.suites || []);

      // Load test reports
      const reportsResponse = await fetch('/api/plugins/testing?action=reports');
      const reportsData = await reportsResponse.json();
      setTestReports(reportsData.reports || []);

      // Load test coverage
      const coverageResponse = await fetch('/api/plugins/testing?action=coverage');
      const coverageData = await coverageResponse.json();
      setTestCoverage(coverageData.coverage || null);

    } catch (error) {
      setError('Failed to load testing data');
    } finally {
      setLoading(false);
    }
  };

  const runTestSuite = async (suiteId: string) => {
    try {
      setRunningTests(prev => new Set(prev).add(suiteId));
      
      const response = await fetch(`/api/plugins/testing?action=run-suite&suite_id=${suiteId}`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error('Failed to run test suite');
      }
      
      const data = await response.json();
      
      // Add new report to the list
      setTestReports(prev => [data.report, ...prev]);
      
      setRunningTests(prev => {
        const newSet = new Set(prev);
        newSet.delete(suiteId);
        return newSet;
      });
      
    } catch (error) {
      setError('Failed to run test suite');
      setRunningTests(prev => {
        const newSet = new Set(prev);
        newSet.delete(suiteId);
        return newSet;
      });
    }
  };

  const runAllTestSuites = async () => {
    try {
      setRunningTests(prev => new Set(prev).add('all'));
      
      const response = await fetch('/api/plugins/testing?action=run-all', {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error('Failed to run all test suites');
      }
      
      const data = await response.json();
      
      // Add new reports to the list
      setTestReports(prev => [...data.reports, ...prev]);
      
      setRunningTests(prev => {
        const newSet = new Set(prev);
        newSet.delete('all');
        return newSet;
      });
      
    } catch (error) {
      setError('Failed to run all test suites');
      setRunningTests(prev => {
        const newSet = new Set(prev);
        newSet.delete('all');
        return newSet;
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'skipped': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'running': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      case 'skipped': return <AlertTriangle className="w-4 h-4" />;
      case 'error': return <XCircle className="w-4 h-4" />;
      case 'running': return <Clock className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'marketplace': return <Database className="w-4 h-4" />;
      case 'installation': return <Download className="w-4 h-4" />;
      case 'execution': return <Play className="w-4 h-4" />;
      case 'communication': return <Network className="w-4 h-4" />;
      case 'enterprise': return <Layers className="w-4 h-4" />;
      case 'security': return <Shield className="w-4 h-4" />;
      case 'performance': return <Zap className="w-4 h-4" />;
      case 'compliance': return <Lock className="w-4 h-4" />;
      default: return <TestTube className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plugin Testing Dashboard</h1>
          <p className="text-gray-600">Comprehensive testing suite for plugin system</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadTestingData}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={runAllTestSuites}
            disabled={runningTests.has('all')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {runningTests.has('all') ? (
              <Clock className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            Run All Tests
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TestTube className="w-8 h-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Test Suites</p>
              <p className="text-2xl font-semibold text-gray-900">{testSuites.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Passed Tests</p>
              <p className="text-2xl font-semibold text-gray-900">
                {testReports.reduce((sum, report) => sum + report.summary.passed, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Failed Tests</p>
              <p className="text-2xl font-semibold text-gray-900">
                {testReports.reduce((sum, report) => sum + report.summary.failed, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Coverage</p>
              <p className="text-2xl font-semibold text-gray-900">
                {testCoverage ? `${testCoverage.lines.percentage}%` : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: BarChart3 },
            { id: 'suites', name: 'Test Suites', icon: TestTube },
            { id: 'reports', name: 'Test Reports', icon: FileText },
            { id: 'coverage', name: 'Coverage', icon: Target },
            { id: 'security', name: 'Security', icon: Shield },
            { id: 'performance', name: 'Performance', icon: Zap }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Test Reports */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Test Reports</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {testReports.slice(0, 5).map((report) => (
                <div key={report.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(report.status)}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {testSuites.find(s => s.id === report.suiteId)?.name || 'Unknown Suite'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(report.startTime).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {report.summary.passed}/{report.summary.total}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Test Coverage */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Test Coverage</h3>
            </div>
            <div className="p-6">
              {testCoverage ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Lines</span>
                    <span className="text-sm text-gray-900">{testCoverage.lines.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${testCoverage.lines.percentage}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Functions</span>
                    <span className="text-sm text-gray-900">{testCoverage.functions.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${testCoverage.functions.percentage}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Branches</span>
                    <span className="text-sm text-gray-900">{testCoverage.branches.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-600 h-2 rounded-full" 
                      style={{ width: `${testCoverage.branches.percentage}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Statements</span>
                    <span className="text-sm text-gray-900">{testCoverage.statements.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ width: `${testCoverage.statements.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No coverage data available</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'suites' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Test Suites</h3>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search test suites..."
                    value={filter.search}
                    onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={filter.category}
                  onChange={(e) => setFilter({ ...filter, category: e.target.value })}
                  className="border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  <option value="marketplace">Marketplace</option>
                  <option value="installation">Installation</option>
                  <option value="execution">Execution</option>
                  <option value="communication">Communication</option>
                  <option value="enterprise">Enterprise</option>
                  <option value="security">Security</option>
                  <option value="performance">Performance</option>
                  <option value="compliance">Compliance</option>
                </select>
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {testSuites.map((suite) => (
              <div key={suite.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      {getCategoryIcon(suite.categories[0])}
                      <h4 className="text-lg font-medium text-gray-900">{suite.name}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{suite.description}</p>
                    <p className="text-sm text-gray-500">
                      {suite.testCount} tests • {suite.categories.join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => runTestSuite(suite.id)}
                      disabled={runningTests.has(suite.id)}
                      className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                      {runningTests.has(suite.id) ? (
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4 mr-2" />
                      )}
                      Run
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600" title="View Details">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Test Reports</h3>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search reports..."
                    value={filter.search}
                    onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={filter.status}
                  onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                  className="border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="running">Running</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {testReports.map((report) => (
              <div key={report.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(report.status)}
                      <h4 className="text-lg font-medium text-gray-900">
                        {testSuites.find(s => s.id === report.suiteId)?.name || 'Unknown Suite'}
                      </h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Started {new Date(report.startTime).toLocaleString()}
                      {report.endTime && (
                        <span className="ml-2">
                          • Duration: {Math.round(report.duration / 1000)}s
                        </span>
                      )}
                    </p>
                    <div className="mt-2 flex items-center space-x-4">
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">Passed:</span> {report.summary.passed}
                      </div>
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">Failed:</span> {report.summary.failed}
                      </div>
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">Skipped:</span> {report.summary.skipped}
                      </div>
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">Pass Rate:</span> {report.summary.passRate.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600" title="View Details">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600" title="Download Report">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'coverage' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Test Coverage</h3>
          </div>
          <div className="p-6">
            {testCoverage ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{testCoverage.lines.percentage}%</div>
                    <div className="text-sm text-gray-500">Lines</div>
                    <div className="text-xs text-gray-400">{testCoverage.lines.covered}/{testCoverage.lines.total}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{testCoverage.functions.percentage}%</div>
                    <div className="text-sm text-gray-500">Functions</div>
                    <div className="text-xs text-gray-400">{testCoverage.functions.covered}/{testCoverage.functions.total}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600">{testCoverage.branches.percentage}%</div>
                    <div className="text-sm text-gray-500">Branches</div>
                    <div className="text-xs text-gray-400">{testCoverage.branches.covered}/{testCoverage.branches.total}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">{testCoverage.statements.percentage}%</div>
                    <div className="text-sm text-gray-500">Statements</div>
                    <div className="text-xs text-gray-400">{testCoverage.statements.covered}/{testCoverage.statements.total}</div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No coverage data available</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Security Tests</h3>
          </div>
          <div className="p-6">
            <p className="text-gray-500">Security test results will be displayed here</p>
          </div>
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Performance Tests</h3>
          </div>
          <div className="p-6">
            <p className="text-gray-500">Performance test results will be displayed here</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
