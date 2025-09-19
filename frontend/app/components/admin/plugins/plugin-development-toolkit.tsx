'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Play, 
  Square, 
  RefreshCw, 
  Download, 
  Upload, 
  Settings,
  Code,
  TestTube,
  Bug,
  Monitor,
  Docker,
  Terminal,
  FileText,
  Package,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface PluginProject {
  id: string;
  name: string;
  description: string;
  template: string;
  status: 'active' | 'inactive' | 'building' | 'testing';
  lastModified: Date;
  path: string;
}

interface PluginTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  files: string[];
  dependencies: string[];
}

interface TestResult {
  id: string;
  name: string;
  status: 'passed' | 'failed' | 'running';
  duration: number;
  output: string;
  timestamp: Date;
}

interface SandboxConfig {
  memoryLimit: string;
  timeout: number;
  networkAccess: boolean;
  fileSystemAccess: boolean;
  environment: Record<string, string>;
}

const PLUGIN_TEMPLATES: PluginTemplate[] = [
  {
    id: 'patient-analyzer',
    name: 'Patient Data Analyzer',
    description: 'Analyze patient data for clinical insights',
    category: 'clinical',
    files: ['plugin.js', 'package.json', 'README.md'],
    dependencies: ['@hmhcp/sdk', 'lodash', 'moment']
  },
  {
    id: 'compliance-validator',
    name: 'Compliance Validator',
    description: 'Validate healthcare compliance requirements',
    category: 'compliance',
    files: ['plugin.js', 'package.json', 'tests.js'],
    dependencies: ['@hmhcp/sdk', 'joi', 'moment']
  },
  {
    id: 'data-processor',
    name: 'Data Processor',
    description: 'Process and transform healthcare data',
    category: 'data',
    files: ['plugin.js', 'package.json', 'utils.js'],
    dependencies: ['@hmhcp/sdk', 'csv-parser', 'json2csv']
  },
  {
    id: 'notification-sender',
    name: 'Notification Sender',
    description: 'Send notifications and alerts',
    category: 'communication',
    files: ['plugin.js', 'package.json', 'templates.js'],
    dependencies: ['@hmhcp/sdk', 'nodemailer', 'twilio']
  }
];

export function PluginDevelopmentToolkit() {
  const [projects, setProjects] = useState<PluginProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<PluginProject | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [sandboxConfig, setSandboxConfig] = useState<SandboxConfig>({
    memoryLimit: '512MB',
    timeout: 30000,
    networkAccess: true,
    fileSystemAccess: false,
    environment: {}
  });
  const [activeTab, setActiveTab] = useState('projects');
  const [devServerStatus, setDevServerStatus] = useState<'running' | 'stopped'>('stopped');

  // Load projects on component mount
  useEffect(() => {
    loadProjects();
    checkDevServerStatus();
  }, []);

  const loadProjects = async () => {
    // Simulate loading projects
    const mockProjects: PluginProject[] = [
      {
        id: 'proj_1',
        name: 'Patient Risk Assessment',
        description: 'Analyzes patient data for health risks',
        template: 'patient-analyzer',
        status: 'active',
        lastModified: new Date(Date.now() - 1000 * 60 * 30),
        path: '/workspace/patient-risk-assessment'
      },
      {
        id: 'proj_2',
        name: 'HIPAA Compliance Checker',
        description: 'Validates HIPAA compliance requirements',
        template: 'compliance-validator',
        status: 'testing',
        lastModified: new Date(Date.now() - 1000 * 60 * 60),
        path: '/workspace/hipaa-compliance-checker'
      }
    ];
    setProjects(mockProjects);
  };

  const checkDevServerStatus = async () => {
    try {
      const response = await fetch('http://localhost:3000/health');
      setDevServerStatus(response.ok ? 'running' : 'stopped');
    } catch (error) {
      setDevServerStatus('stopped');
    }
  };

  const createProject = async (projectData: {
    name: string;
    description: string;
    template: string;
  }) => {
    setIsCreating(true);
    try {
      // Simulate project creation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newProject: PluginProject = {
        id: `proj_${Date.now()}`,
        name: projectData.name,
        description: projectData.description,
        template: projectData.template,
        status: 'active',
        lastModified: new Date(),
        path: `/workspace/${projectData.name.toLowerCase().replace(/\s+/g, '-')}`
      };
      
      setProjects([newProject, ...projects]);
      setIsCreating(false);
      toast.success('Project created successfully');
    } catch (error) {
      setIsCreating(false);
      toast.error('Failed to create project');
    }
  };

  const buildProject = async (projectId: string) => {
    setIsBuilding(true);
    try {
      // Simulate build process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setProjects(projects.map(p => 
        p.id === projectId ? { ...p, status: 'active' } : p
      ));
      
      setIsBuilding(false);
      toast.success('Project built successfully');
    } catch (error) {
      setIsBuilding(false);
      toast.error('Build failed');
    }
  };

  const testProject = async (projectId: string) => {
    setIsTesting(true);
    try {
      // Simulate test execution
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockTestResults: TestResult[] = [
        {
          id: 'test_1',
          name: 'Plugin Lifecycle Test',
          status: 'passed',
          duration: 150,
          output: 'Plugin registration, activation, and deactivation successful',
          timestamp: new Date()
        },
        {
          id: 'test_2',
          name: 'Data Validation Test',
          status: 'passed',
          duration: 200,
          output: 'Input data validation working correctly',
          timestamp: new Date()
        },
        {
          id: 'test_3',
          name: 'Compliance Test',
          status: 'failed',
          duration: 300,
          output: 'HIPAA compliance validation failed: Missing audit logging',
          timestamp: new Date()
        }
      ];
      
      setTestResults(mockTestResults);
      setIsTesting(false);
      toast.success('Tests completed');
    } catch (error) {
      setIsTesting(false);
      toast.error('Test execution failed');
    }
  };

  const startDevServer = async () => {
    try {
      // Simulate starting dev server
      await new Promise(resolve => setTimeout(resolve, 1000));
      setDevServerStatus('running');
      toast.success('Development server started');
    } catch (error) {
      toast.error('Failed to start development server');
    }
  };

  const stopDevServer = async () => {
    try {
      // Simulate stopping dev server
      await new Promise(resolve => setTimeout(resolve, 500));
      setDevServerStatus('stopped');
      toast.success('Development server stopped');
    } catch (error) {
      toast.error('Failed to stop development server');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running': return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'building': return 'bg-blue-100 text-blue-800';
      case 'testing': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Plugin Development Toolkit</h2>
          <p className="text-muted-foreground">
            Create, build, test, and debug healthcare plugins locally
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              devServerStatus === 'running' ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className="text-sm text-muted-foreground">
              Dev Server: {devServerStatus}
            </span>
          </div>
          {devServerStatus === 'running' ? (
            <Button variant="outline" size="sm" onClick={stopDevServer}>
              <Square className="h-4 w-4 mr-2" />
              Stop Server
            </Button>
          ) : (
            <Button size="sm" onClick={startDevServer}>
              <Play className="h-4 w-4 mr-2" />
              Start Server
            </Button>
          )}
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
          <TabsTrigger value="sandbox">Sandbox</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Plugin Projects</CardTitle>
                    <CardDescription>
                      Manage your plugin development projects
                    </CardDescription>
                  </div>
                  <Button onClick={() => setIsCreating(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Project
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedProject?.id === project.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedProject(project)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        <span className="font-medium">{project.name}</span>
                        <Badge className={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            buildProject(project.id);
                          }}
                          disabled={isBuilding}
                        >
                          <Package className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            testProject(project.id);
                          }}
                          disabled={isTesting}
                        >
                          <TestTube className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {project.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Template: {project.template}</span>
                      <span>Modified: {project.lastModified.toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Project Details */}
            {selectedProject && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    {selectedProject.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Description</Label>
                    <p className="text-sm">{selectedProject.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Template</Label>
                      <p className="text-sm font-medium">{selectedProject.template}</p>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Badge className={getStatusColor(selectedProject.status)}>
                        {selectedProject.status}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <Label>Path</Label>
                    <p className="text-sm font-mono bg-muted p-2 rounded">
                      {selectedProject.path}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => buildProject(selectedProject.id)}
                      disabled={isBuilding}
                    >
                      {isBuilding ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Package className="h-4 w-4 mr-2" />
                      )}
                      {isBuilding ? 'Building...' : 'Build'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => testProject(selectedProject.id)}
                      disabled={isTesting}
                    >
                      {isTesting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <TestTube className="h-4 w-4 mr-2" />
                      )}
                      {isTesting ? 'Testing...' : 'Test'}
                    </Button>
                    <Button variant="outline">
                      <Bug className="h-4 w-4 mr-2" />
                      Debug
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Plugin Templates</CardTitle>
              <CardDescription>
                Choose from pre-built plugin templates to get started quickly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {PLUGIN_TEMPLATES.map((template) => (
                  <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Category:</span>
                          <p className="font-medium capitalize">{template.category}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Files:</span>
                          <p className="font-medium">{template.files.length} files</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Dependencies:</span>
                          <p className="font-medium">{template.dependencies.length} packages</p>
                        </div>
                      </div>
                      <Button
                        className="w-full mt-4"
                        onClick={() => {
                          // Create project from template
                          createProject({
                            name: template.name,
                            description: template.description,
                            template: template.id
                          });
                        }}
                      >
                        Use Template
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Plugin Testing</CardTitle>
              <CardDescription>
                Run tests and view results for your plugins
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.length > 0 ? (
                <div className="space-y-4">
                  {testResults.map((result) => (
                    <div key={result.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(result.status)}
                          <span className="font-medium">{result.name}</span>
                          <Badge variant={result.status === 'passed' ? 'default' : 'destructive'}>
                            {result.status}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {result.duration}ms
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {result.output}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TestTube className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No test results yet</p>
                  <p className="text-sm text-muted-foreground">
                    Run tests on a project to see results here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sandbox" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sandbox Configuration</CardTitle>
              <CardDescription>
                Configure the plugin execution sandbox environment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Memory Limit</Label>
                  <Select
                    value={sandboxConfig.memoryLimit}
                    onValueChange={(value) => setSandboxConfig({
                      ...sandboxConfig,
                      memoryLimit: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="256MB">256MB</SelectItem>
                      <SelectItem value="512MB">512MB</SelectItem>
                      <SelectItem value="1GB">1GB</SelectItem>
                      <SelectItem value="2GB">2GB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Timeout (ms)</Label>
                  <Input
                    type="number"
                    value={sandboxConfig.timeout}
                    onChange={(e) => setSandboxConfig({
                      ...sandboxConfig,
                      timeout: parseInt(e.target.value)
                    })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Network Access</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow plugins to make network requests
                    </p>
                  </div>
                  <Switch
                    checked={sandboxConfig.networkAccess}
                    onCheckedChange={(checked) => setSandboxConfig({
                      ...sandboxConfig,
                      networkAccess: checked
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>File System Access</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow plugins to access the file system
                    </p>
                  </div>
                  <Switch
                    checked={sandboxConfig.fileSystemAccess}
                    onCheckedChange={(checked) => setSandboxConfig({
                      ...sandboxConfig,
                      fileSystemAccess: checked
                    })}
                  />
                </div>
              </div>

              <div>
                <Label>Environment Variables</Label>
                <Textarea
                  placeholder="KEY1=value1&#10;KEY2=value2"
                  value={Object.entries(sandboxConfig.environment)
                    .map(([key, value]) => `${key}=${value}`)
                    .join('\n')}
                  onChange={(e) => {
                    const env = {};
                    e.target.value.split('\n').forEach(line => {
                      const [key, value] = line.split('=');
                      if (key && value) {
                        env[key] = value;
                      }
                    });
                    setSandboxConfig({
                      ...sandboxConfig,
                      environment: env
                    });
                  }}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {projects.filter(p => p.status === 'active').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  of {projects.length} total
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Test Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">85%</div>
                <p className="text-xs text-muted-foreground">
                  Last 24 hours
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Build Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2.3s</div>
                <p className="text-xs text-muted-foreground">
                  Average
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">45MB</div>
                <p className="text-xs text-muted-foreground">
                  Current
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
