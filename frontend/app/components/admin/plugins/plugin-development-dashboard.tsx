// Plugin Development Dashboard Component
// Story 6.2: WordPress-Style Plugin Marketplace & Management

'use client';

import React, { useState, useEffect } from 'react';
import {
  Code,
  Play,
  Square,
  Download,
  Upload,
  Settings,
  FileText,
  TestTube,
  Bug,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  Folder,
  Terminal,
  BookOpen,
  Zap,
  Shield,
  Database,
  Network,
  Eye,
  EyeOff
} from 'lucide-react';

interface PluginProject {
  id: string;
  name: string;
  version: string;
  description: string;
  status: 'development' | 'testing' | 'ready' | 'published';
  lastModified: string;
  files: string[];
  tests: {
    total: number;
    passed: number;
    failed: number;
  };
  linting: {
    errors: number;
    warnings: number;
  };
}

interface DevelopmentStats {
  totalProjects: number;
  activeProjects: number;
  publishedPlugins: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
}

export default function PluginDevelopmentDashboard() {
  const [projects, setProjects] = useState<PluginProject[]>([]);
  const [stats, setStats] = useState<DevelopmentStats>({
    totalProjects: 0,
    activeProjects: 0,
    publishedPlugins: 0,
    totalTests: 0,
    passedTests: 0,
    failedTests: 0
  });
  const [selectedProject, setSelectedProject] = useState<PluginProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      // This would load projects from the API
      const mockProjects: PluginProject[] = [
        {
          id: '1',
          name: 'Data Processor Plugin',
          version: '1.0.0',
          description: 'Processes healthcare data with HIPAA compliance',
          status: 'development',
          lastModified: '2025-01-04T10:30:00Z',
          files: ['src/index.js', 'src/processor.js', 'tests/test.js'],
          tests: { total: 15, passed: 12, failed: 3 },
          linting: { errors: 2, warnings: 5 }
        },
        {
          id: '2',
          name: 'Workflow Automation',
          version: '0.9.0',
          description: 'Automates healthcare workflows',
          status: 'testing',
          lastModified: '2025-01-04T09:15:00Z',
          files: ['src/index.js', 'src/workflow.js', 'tests/test.js'],
          tests: { total: 20, passed: 18, failed: 2 },
          linting: { errors: 0, warnings: 3 }
        },
        {
          id: '3',
          name: 'Integration Plugin',
          version: '2.1.0',
          description: 'Integrates with external healthcare systems',
          status: 'published',
          lastModified: '2025-01-03T16:45:00Z',
          files: ['src/index.js', 'src/integration.js', 'tests/test.js'],
          tests: { total: 25, passed: 25, failed: 0 },
          linting: { errors: 0, warnings: 1 }
        }
      ];

      setProjects(mockProjects);
      setStats({
        totalProjects: mockProjects.length,
        activeProjects: mockProjects.filter(p => p.status === 'development' || p.status === 'testing').length,
        publishedPlugins: mockProjects.filter(p => p.status === 'published').length,
        totalTests: mockProjects.reduce((sum, p) => sum + p.tests.total, 0),
        passedTests: mockProjects.reduce((sum, p) => sum + p.tests.passed, 0),
        failedTests: mockProjects.reduce((sum, p) => sum + p.tests.failed, 0)
      });
    } catch (error) {
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const createNewProject = async () => {
    try {
      // This would create a new project
      console.log('Creating new project...');
    } catch (error) {
      setError('Failed to create project');
    }
  };

  const runTests = async (projectId: string) => {
    try {
      // This would run tests for the project
      console.log('Running tests for project:', projectId);
    } catch (error) {
      setError('Failed to run tests');
    }
  };

  const buildProject = async (projectId: string) => {
    try {
      // This would build the project
      console.log('Building project:', projectId);
    } catch (error) {
      setError('Failed to build project');
    }
  };

  const publishPlugin = async (projectId: string) => {
    try {
      // This would publish the plugin
      console.log('Publishing plugin:', projectId);
    } catch (error) {
      setError('Failed to publish plugin');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'development': return 'text-blue-600 bg-blue-100';
      case 'testing': return 'text-yellow-600 bg-yellow-100';
      case 'ready': return 'text-green-600 bg-green-100';
      case 'published': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'development': return <Code className="w-4 h-4" />;
      case 'testing': return <TestTube className="w-4 h-4" />;
      case 'ready': return <CheckCircle className="w-4 h-4" />;
      case 'published': return <Upload className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
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
          <h1 className="text-2xl font-bold text-gray-900">Plugin Development Dashboard</h1>
          <p className="text-gray-600">Manage your plugin development projects</p>
        </div>
        <button
          onClick={createNewProject}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Folder className="w-8 h-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Projects</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalProjects}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Zap className="w-8 h-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Projects</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeProjects}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Upload className="w-8 h-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Published Plugins</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.publishedPlugins}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TestTube className="w-8 h-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Test Success Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.totalTests > 0 ? Math.round((stats.passedTests / stats.totalTests) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Projects</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {projects.map((project) => (
            <div key={project.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="text-lg font-medium text-gray-900">{project.name}</h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                      {getStatusIcon(project.status)}
                      <span className="ml-1 capitalize">{project.status}</span>
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span>Version {project.version}</span>
                    <span>•</span>
                    <span>Modified {new Date(project.lastModified).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{project.files.length} files</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {/* Test Status */}
                  <div className="flex items-center space-x-1">
                    {project.tests.failed > 0 ? (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    <span className="text-sm text-gray-600">
                      {project.tests.passed}/{project.tests.total}
                    </span>
                  </div>

                  {/* Linting Status */}
                  <div className="flex items-center space-x-1">
                    {project.linting.errors > 0 ? (
                      <Bug className="w-4 h-4 text-red-500" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    <span className="text-sm text-gray-600">
                      {project.linting.errors}E/{project.linting.warnings}W
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => runTests(project.id)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                      title="Run Tests"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => buildProject(project.id)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                      title="Build Project"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    {project.status === 'ready' && (
                      <button
                        onClick={() => publishPlugin(project.id)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        title="Publish Plugin"
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedProject(project)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Project Details Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">{selectedProject.name}</h3>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Project Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Project Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Version:</strong> {selectedProject.version}</div>
                    <div><strong>Status:</strong> 
                      <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedProject.status)}`}>
                        {getStatusIcon(selectedProject.status)}
                        <span className="ml-1 capitalize">{selectedProject.status}</span>
                      </span>
                    </div>
                    <div><strong>Last Modified:</strong> {new Date(selectedProject.lastModified).toLocaleString()}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-sm text-gray-600">{selectedProject.description}</p>
                </div>
              </div>

              {/* Files */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Files</h4>
                <div className="space-y-1">
                  {selectedProject.files.map((file, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{file}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Test Results */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Test Results</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{selectedProject.tests.total}</div>
                    <div className="text-sm text-gray-500">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{selectedProject.tests.passed}</div>
                    <div className="text-sm text-gray-500">Passed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{selectedProject.tests.failed}</div>
                    <div className="text-sm text-gray-500">Failed</div>
                  </div>
                </div>
              </div>

              {/* Linting Results */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Linting Results</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{selectedProject.linting.errors}</div>
                    <div className="text-sm text-gray-500">Errors</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{selectedProject.linting.warnings}</div>
                    <div className="text-sm text-gray-500">Warnings</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => runTests(selectedProject.id)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Run Tests
                </button>
                <button
                  onClick={() => buildProject(selectedProject.id)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Build
                </button>
                {selectedProject.status === 'ready' && (
                  <button
                    onClick={() => publishPlugin(selectedProject.id)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Publish
                  </button>
                )}
              </div>
            </div>
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
