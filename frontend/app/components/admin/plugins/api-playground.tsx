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
  Copy, 
  Download, 
  Settings, 
  Code, 
  Zap, 
  Shield, 
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface APIRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers: Record<string, string>;
  body?: any;
  queryParams?: Record<string, string>;
}

interface APIResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  executionTime: number;
  timestamp: string;
}

interface TestResult {
  id: string;
  name: string;
  status: 'passed' | 'failed' | 'running';
  duration: number;
  error?: string;
  details?: any;
}

interface SecurityScanResult {
  vulnerabilities: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    recommendation: string;
  }>;
  score: number;
  passed: boolean;
}

const API_TEMPLATES = {
  'plugin-execute': {
    method: 'POST' as const,
    url: '/api/plugins/developer/sdk/plugins/{pluginId}/execute',
    headers: {
      'Authorization': 'Bearer {apiKey}',
      'Content-Type': 'application/json'
    },
    body: {
      data: {
        patientId: 'patient-123',
        vitalSigns: {
          bloodPressure: { systolic: 120, diastolic: 80 },
          heartRate: 72,
          temperature: 98.6
        }
      },
      sandbox: true
    }
  },
  'plugin-list': {
    method: 'GET' as const,
    url: '/api/plugins/developer/sdk/plugins',
    headers: {
      'Authorization': 'Bearer {apiKey}'
    },
    queryParams: {
      page: '1',
      limit: '20'
    }
  },
  'webhook-register': {
    method: 'POST' as const,
    url: '/api/plugins/developer/webhooks',
    headers: {
      'Authorization': 'Bearer {apiKey}',
      'Content-Type': 'application/json'
    },
    body: {
      event: 'patient.created',
      url: 'https://your-app.com/webhooks/patient-created',
      headers: {
        'Authorization': 'Bearer your-token'
      }
    }
  },
  'compliance-validate': {
    method: 'POST' as const,
    url: '/api/plugins/developer/compliance/validate',
    headers: {
      'Authorization': 'Bearer {apiKey}',
      'Content-Type': 'application/json'
    },
    body: {
      data: {
        patientId: 'patient-123',
        data: {
          vitalSigns: {
            bloodPressure: { systolic: 120, diastolic: 80 },
            heartRate: 72
          }
        }
      },
      frameworks: ['hipaa', 'fhir']
    }
  }
};

export function APIPlayground() {
  const [request, setRequest] = useState<APIRequest>({
    method: 'GET',
    url: '/api/plugins/developer/sdk/plugins',
    headers: {
      'Authorization': 'Bearer your-api-key',
      'Content-Type': 'application/json'
    },
    queryParams: {}
  });
  
  const [response, setResponse] = useState<APIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [securityScan, setSecurityScan] = useState<SecurityScanResult | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('plugin-list');
  const [autoTest, setAutoTest] = useState(true);
  const [securityScanEnabled, setSecurityScanEnabled] = useState(true);

  const handleTemplateChange = (templateKey: string) => {
    const template = API_TEMPLATES[templateKey as keyof typeof API_TEMPLATES];
    if (template) {
      setRequest({
        ...template,
        headers: { ...template.headers }
      });
      setSelectedTemplate(templateKey);
    }
  };

  const handleExecuteRequest = async () => {
    setIsLoading(true);
    setResponse(null);
    setTestResults([]);
    setSecurityScan(null);

    try {
      // Simulate API call
      const startTime = Date.now();
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      const executionTime = Date.now() - startTime;

      // Generate mock response based on request
      const mockResponse = generateMockResponse(request);
      
      setResponse({
        status: mockResponse.status,
        statusText: mockResponse.statusText,
        headers: mockResponse.headers,
        data: mockResponse.data,
        executionTime,
        timestamp: new Date().toISOString()
      });

      // Run automated tests if enabled
      if (autoTest) {
        await runAutomatedTests(request, mockResponse);
      }

      // Run security scan if enabled
      if (securityScanEnabled) {
        await runSecurityScan(request);
      }

      toast.success('Request executed successfully');
    } catch (error) {
      toast.error('Request failed');
      setResponse({
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        data: { error: 'Request failed' },
        executionTime: 0,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockResponse = (req: APIRequest): { status: number; statusText: string; headers: Record<string, string>; data: any } => {
    // Generate different responses based on the endpoint
    if (req.url.includes('/plugins') && req.method === 'GET') {
      return {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'application/json',
          'X-Rate-Limit-Remaining': '999'
        },
        data: {
          plugins: [
            {
              id: 'patient-risk-assessment',
              name: 'Patient Risk Assessment',
              version: '1.0.0',
              description: 'Analyzes patient data for health risks',
              author: 'Healthcare Solutions Inc.',
              healthcareCompliance: ['hipaa', 'fhir'],
              status: 'active',
              installationCount: 42
            }
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 1
          }
        }
      };
    }

    if (req.url.includes('/execute') && req.method === 'POST') {
      return {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'application/json',
          'X-Execution-Time': '150ms'
        },
        data: {
          result: {
            riskFactors: {
              cardiovascular: 0.3,
              diabetes: 0.2,
              hypertension: 0.1,
              obesity: 0.2,
              overall: 0.2
            },
            recommendations: ['Continue regular health monitoring'],
            urgency: 'low'
          },
          executionTime: 150,
          memoryUsage: 45,
          complianceValidated: true
        }
      };
    }

    if (req.url.includes('/webhooks') && req.method === 'POST') {
      return {
        status: 201,
        statusText: 'Created',
        headers: {
          'Content-Type': 'application/json',
          'Location': '/api/plugins/developer/webhooks/webhook-123'
        },
        data: {
          id: 'webhook-123',
          event: 'patient.created',
          url: 'https://your-app.com/webhooks/patient-created',
          status: 'active',
          createdAt: new Date().toISOString()
        }
      };
    }

    if (req.url.includes('/compliance/validate') && req.method === 'POST') {
      return {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          valid: true,
          frameworks: {
            hipaa: {
              valid: true,
              violations: []
            },
            fhir: {
              valid: true,
              violations: []
            }
          },
          recommendations: []
        }
      };
    }

    // Default response
    return {
      status: 200,
      statusText: 'OK',
      headers: {
        'Content-Type': 'application/json'
      },
      data: { message: 'Request successful' }
    };
  };

  const runAutomatedTests = async (req: APIRequest, res: any) => {
    const tests: TestResult[] = [];
    
    // Test 1: Response Status
    tests.push({
      id: 'status-check',
      name: 'Response Status Check',
      status: res.status >= 200 && res.status < 300 ? 'passed' : 'failed',
      duration: 10,
      details: { expected: '2xx', actual: res.status }
    });

    // Test 2: Response Time
    const responseTime = response?.executionTime || 0;
    tests.push({
      id: 'response-time',
      name: 'Response Time Check',
      status: responseTime < 5000 ? 'passed' : 'failed',
      duration: 5,
      details: { expected: '< 5000ms', actual: `${responseTime}ms` }
    });

    // Test 3: Content Type
    const contentType = res.headers['Content-Type'] || res.headers['content-type'];
    tests.push({
      id: 'content-type',
      name: 'Content Type Check',
      status: contentType?.includes('application/json') ? 'passed' : 'failed',
      duration: 5,
      details: { expected: 'application/json', actual: contentType }
    });

    // Test 4: Authentication
    const hasAuth = req.headers.Authorization || req.headers.authorization;
    tests.push({
      id: 'authentication',
      name: 'Authentication Check',
      status: hasAuth ? 'passed' : 'failed',
      duration: 5,
      details: { expected: 'Bearer token', actual: hasAuth ? 'Present' : 'Missing' }
    });

    // Test 5: Healthcare Compliance (if applicable)
    if (req.url.includes('/compliance') || req.body?.frameworks) {
      tests.push({
        id: 'compliance',
        name: 'Healthcare Compliance Check',
        status: res.data?.valid ? 'passed' : 'failed',
        duration: 15,
        details: { expected: 'Compliant', actual: res.data?.valid ? 'Valid' : 'Invalid' }
      });
    }

    setTestResults(tests);
  };

  const runSecurityScan = async (req: APIRequest) => {
    // Simulate security scan
    await new Promise(resolve => setTimeout(resolve, 500));

    const vulnerabilities = [];
    
    // Check for common security issues
    if (req.url.includes('http://')) {
      vulnerabilities.push({
        type: 'Insecure Protocol',
        severity: 'high' as const,
        description: 'Using HTTP instead of HTTPS',
        recommendation: 'Use HTTPS for all API communications'
      });
    }

    if (req.headers.Authorization?.includes('Bearer your-api-key')) {
      vulnerabilities.push({
        type: 'Hardcoded Credentials',
        severity: 'critical' as const,
        description: 'Using placeholder API key',
        recommendation: 'Use environment variables for API keys'
      });
    }

    if (req.body && typeof req.body === 'object' && JSON.stringify(req.body).includes('password')) {
      vulnerabilities.push({
        type: 'Sensitive Data Exposure',
        severity: 'medium' as const,
        description: 'Password in request body',
        recommendation: 'Use secure authentication methods'
      });
    }

    const score = Math.max(0, 100 - (vulnerabilities.length * 20));
    
    setSecurityScan({
      vulnerabilities,
      score,
      passed: vulnerabilities.length === 0
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const exportRequest = () => {
    const curlCommand = generateCurlCommand(request);
    copyToClipboard(curlCommand);
  };

  const generateCurlCommand = (req: APIRequest): string => {
    let curl = `curl -X ${req.method} "https://api.hmhcp.com${req.url}"`;
    
    Object.entries(req.headers).forEach(([key, value]) => {
      curl += ` \\\n  -H "${key}: ${value}"`;
    });

    if (req.body) {
      curl += ` \\\n  -d '${JSON.stringify(req.body, null, 2)}'`;
    }

    if (req.queryParams && Object.keys(req.queryParams).length > 0) {
      const params = new URLSearchParams(req.queryParams);
      curl = curl.replace('"', `"?${params.toString()}"`);
    }

    return curl;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running': return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">API Playground</h2>
          <p className="text-muted-foreground">
            Test and experiment with the HMHCP Developer API
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={exportRequest}>
            <Download className="h-4 w-4 mr-2" />
            Export cURL
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Configuration */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Request Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Template Selection */}
              <div className="space-y-2">
                <Label>API Template</Label>
                <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plugin-list">List Plugins</SelectItem>
                    <SelectItem value="plugin-execute">Execute Plugin</SelectItem>
                    <SelectItem value="webhook-register">Register Webhook</SelectItem>
                    <SelectItem value="compliance-validate">Validate Compliance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Method and URL */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label>Method</Label>
                  <Select value={request.method} onValueChange={(value: any) => setRequest({...request, method: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>URL</Label>
                  <Input
                    value={request.url}
                    onChange={(e) => setRequest({...request, url: e.target.value})}
                    placeholder="/api/endpoint"
                  />
                </div>
              </div>

              {/* Headers */}
              <div className="space-y-2">
                <Label>Headers</Label>
                <div className="space-y-2">
                  {Object.entries(request.headers).map(([key, value], index) => (
                    <div key={index} className="grid grid-cols-2 gap-2">
                      <Input
                        value={key}
                        onChange={(e) => {
                          const newHeaders = {...request.headers};
                          delete newHeaders[key];
                          newHeaders[e.target.value] = value;
                          setRequest({...request, headers: newHeaders});
                        }}
                        placeholder="Header name"
                      />
                      <div className="flex gap-2">
                        <Input
                          value={value}
                          onChange={(e) => setRequest({
                            ...request,
                            headers: {...request.headers, [key]: e.target.value}
                          })}
                          placeholder="Header value"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newHeaders = {...request.headers};
                            delete newHeaders[key];
                            setRequest({...request, headers: newHeaders});
                          }}
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRequest({
                      ...request,
                      headers: {...request.headers, '': ''}
                    })}
                  >
                    + Add Header
                  </Button>
                </div>
              </div>

              {/* Request Body */}
              {['POST', 'PUT', 'PATCH'].includes(request.method) && (
                <div className="space-y-2">
                  <Label>Request Body</Label>
                  <Textarea
                    value={request.body ? JSON.stringify(request.body, null, 2) : ''}
                    onChange={(e) => {
                      try {
                        const body = e.target.value ? JSON.parse(e.target.value) : undefined;
                        setRequest({...request, body});
                      } catch (error) {
                        // Keep the text as is for editing
                      }
                    }}
                    placeholder="Enter JSON body"
                    rows={8}
                    className="font-mono text-sm"
                  />
                </div>
              )}

              {/* Query Parameters */}
              <div className="space-y-2">
                <Label>Query Parameters</Label>
                <div className="space-y-2">
                  {Object.entries(request.queryParams || {}).map(([key, value], index) => (
                    <div key={index} className="grid grid-cols-2 gap-2">
                      <Input
                        value={key}
                        onChange={(e) => {
                          const newParams = {...request.queryParams};
                          delete newParams[key];
                          newParams[e.target.value] = value;
                          setRequest({...request, queryParams: newParams});
                        }}
                        placeholder="Parameter name"
                      />
                      <div className="flex gap-2">
                        <Input
                          value={value}
                          onChange={(e) => setRequest({
                            ...request,
                            queryParams: {...request.queryParams, [key]: e.target.value}
                          })}
                          placeholder="Parameter value"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newParams = {...request.queryParams};
                            delete newParams[key];
                            setRequest({...request, queryParams: newParams});
                          }}
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRequest({
                      ...request,
                      queryParams: {...request.queryParams, '': ''}
                    })}
                  >
                    + Add Parameter
                  </Button>
                </div>
              </div>

              {/* Execute Button */}
              <Button
                onClick={handleExecuteRequest}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Execute Request
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Test Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Test Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Automated Testing</Label>
                  <p className="text-sm text-muted-foreground">Run tests after each request</p>
                </div>
                <Switch
                  checked={autoTest}
                  onCheckedChange={setAutoTest}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Security Scanning</Label>
                  <p className="text-sm text-muted-foreground">Scan for security vulnerabilities</p>
                </div>
                <Switch
                  checked={securityScanEnabled}
                  onCheckedChange={setSecurityScanEnabled}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Response and Results */}
        <div className="space-y-6">
          {/* Response */}
          {response && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Response
                  <Badge variant={response.status >= 200 && response.status < 300 ? 'default' : 'destructive'}>
                    {response.status}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Execution time: {response.executionTime}ms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="body" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="body">Body</TabsTrigger>
                    <TabsTrigger value="headers">Headers</TabsTrigger>
                    <TabsTrigger value="raw">Raw</TabsTrigger>
                  </TabsList>
                  <TabsContent value="body" className="space-y-2">
                    <div className="relative">
                      <pre className="p-4 bg-muted rounded-lg text-sm overflow-x-auto">
                        {JSON.stringify(response.data, null, 2)}
                      </pre>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(JSON.stringify(response.data, null, 2))}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="headers" className="space-y-2">
                    <div className="relative">
                      <pre className="p-4 bg-muted rounded-lg text-sm overflow-x-auto">
                        {JSON.stringify(response.headers, null, 2)}
                      </pre>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(JSON.stringify(response.headers, null, 2))}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="raw" className="space-y-2">
                    <div className="relative">
                      <pre className="p-4 bg-muted rounded-lg text-sm overflow-x-auto">
                        {JSON.stringify(response, null, 2)}
                      </pre>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(JSON.stringify(response, null, 2))}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* Test Results */}
          {testResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Test Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {testResults.map((test) => (
                    <div key={test.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(test.status)}
                        <div>
                          <p className="font-medium">{test.name}</p>
                          {test.details && (
                            <p className="text-sm text-muted-foreground">
                              Expected: {test.details.expected}, Actual: {test.details.actual}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={test.status === 'passed' ? 'default' : 'destructive'}>
                          {test.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{test.duration}ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Scan Results */}
          {securityScan && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Scan
                  <Badge variant={securityScan.passed ? 'default' : 'destructive'}>
                    Score: {securityScan.score}/100
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {securityScan.vulnerabilities.length > 0 ? (
                  <div className="space-y-3">
                    {securityScan.vulnerabilities.map((vuln, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{vuln.type}</h4>
                          <Badge className={getSeverityColor(vuln.severity)}>
                            {vuln.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{vuln.description}</p>
                        <p className="text-sm font-medium text-green-600">{vuln.recommendation}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-green-600 font-medium">No security issues found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}