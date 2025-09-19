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
import { Copy, Play, Download, BookOpen, Code, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface APIEndpoint {
  id: string;
  name: string;
  description: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  category: string;
  parameters?: APIParameter[];
  requestBody?: APIRequestBody;
  responses: APIResponse[];
  examples: APIExample[];
}

interface APIParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example?: any;
}

interface APIRequestBody {
  type: string;
  schema: any;
  example?: any;
}

interface APIResponse {
  status: number;
  description: string;
  schema: any;
  example?: any;
}

interface APIExample {
  name: string;
  description: string;
  request: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: any;
  };
  response: {
    status: number;
    body: any;
  };
}

const API_ENDPOINTS: APIEndpoint[] = [
  {
    id: 'list-plugins',
    name: 'List Plugins',
    description: 'Retrieve a list of all available plugins in the marketplace',
    method: 'GET',
    path: '/api/plugins/developer/sdk/plugins',
    category: 'Plugin Management',
    parameters: [
      {
        name: 'page',
        type: 'number',
        required: false,
        description: 'Page number for pagination',
        example: 1
      },
      {
        name: 'limit',
        type: 'number',
        required: false,
        description: 'Number of items per page',
        example: 20
      },
      {
        name: 'category',
        type: 'string',
        required: false,
        description: 'Filter by plugin category',
        example: 'clinical-decision-support'
      }
    ],
    responses: [
      {
        status: 200,
        description: 'Successfully retrieved plugins',
        schema: {
          type: 'object',
          properties: {
            plugins: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  version: { type: 'string' },
                  description: { type: 'string' },
                  author: { type: 'string' },
                  healthcareCompliance: { type: 'array', items: { type: 'string' } },
                  status: { type: 'string' },
                  installationCount: { type: 'number' }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number' }
              }
            }
          }
        },
        example: {
          plugins: [
            {
              id: 'patient-risk-assessment',
              name: 'Patient Risk Assessment',
              version: '1.0.0',
              description: 'Analyzes patient data to identify health risks',
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
      }
    ],
    examples: [
      {
        name: 'Basic Request',
        description: 'Get first page of plugins',
        request: {
          method: 'GET',
          url: '/api/plugins/developer/sdk/plugins',
          headers: {
            'Authorization': 'Bearer your-api-key'
          }
        },
        response: {
          status: 200,
          body: {
            plugins: [],
            pagination: { page: 1, limit: 20, total: 0 }
          }
        }
      }
    ]
  },
  {
    id: 'execute-plugin',
    name: 'Execute Plugin',
    description: 'Execute a plugin with provided data in a sandboxed environment',
    method: 'POST',
    path: '/api/plugins/developer/sdk/plugins/{pluginId}/execute',
    category: 'Plugin Execution',
    parameters: [
      {
        name: 'pluginId',
        type: 'string',
        required: true,
        description: 'ID of the plugin to execute',
        example: 'patient-risk-assessment'
      }
    ],
    requestBody: {
      type: 'object',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            description: 'Input data for the plugin'
          },
          sandbox: {
            type: 'boolean',
            description: 'Whether to run in sandbox mode',
            default: true
          }
        },
        required: ['data']
      },
      example: {
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
    responses: [
      {
        status: 200,
        description: 'Plugin executed successfully',
        schema: {
          type: 'object',
          properties: {
            result: {
              type: 'object',
              description: 'Plugin execution result'
            },
            executionTime: { type: 'number' },
            memoryUsage: { type: 'number' },
            complianceValidated: { type: 'boolean' }
          }
        },
        example: {
          result: {
            riskFactors: {
              cardiovascular: 0.3,
              diabetes: 0.2,
              overall: 0.25
            },
            recommendations: ['Continue regular health monitoring'],
            urgency: 'low'
          },
          executionTime: 150,
          memoryUsage: 45,
          complianceValidated: true
        }
      },
      {
        status: 400,
        description: 'Invalid request data',
        schema: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                details: { type: 'object' }
              }
            }
          }
        }
      }
    ],
    examples: [
      {
        name: 'Patient Risk Assessment',
        description: 'Execute patient risk assessment plugin',
        request: {
          method: 'POST',
          url: '/api/plugins/developer/sdk/plugins/patient-risk-assessment/execute',
          headers: {
            'Authorization': 'Bearer your-api-key',
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
        response: {
          status: 200,
          body: {
            result: {
              riskFactors: { cardiovascular: 0.3, diabetes: 0.2, overall: 0.25 },
              recommendations: ['Continue regular health monitoring'],
              urgency: 'low'
            },
            executionTime: 150,
            memoryUsage: 45,
            complianceValidated: true
          }
        }
      }
    ]
  },
  {
    id: 'register-webhook',
    name: 'Register Webhook',
    description: 'Register a webhook for real-time event notifications',
    method: 'POST',
    path: '/api/plugins/developer/webhooks',
    category: 'Webhook Management',
    requestBody: {
      type: 'object',
      schema: {
        type: 'object',
        properties: {
          event: { type: 'string', description: 'Event type to listen for' },
          url: { type: 'string', description: 'Webhook URL' },
          headers: { type: 'object', description: 'Custom headers' },
          retryPolicy: {
            type: 'object',
            properties: {
              maxRetries: { type: 'number' },
              backoffMultiplier: { type: 'number' }
            }
          }
        },
        required: ['event', 'url']
      },
      example: {
        event: 'patient.created',
        url: 'https://your-app.com/webhooks/patient-created',
        headers: {
          'Authorization': 'Bearer your-token'
        },
        retryPolicy: {
          maxRetries: 3,
          backoffMultiplier: 2
        }
      }
    },
    responses: [
      {
        status: 201,
        description: 'Webhook registered successfully',
        schema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            event: { type: 'string' },
            url: { type: 'string' },
            status: { type: 'string' },
            createdAt: { type: 'string' }
          }
        }
      }
    ],
    examples: [
      {
        name: 'Patient Created Webhook',
        description: 'Register webhook for patient creation events',
        request: {
          method: 'POST',
          url: '/api/plugins/developer/webhooks',
          headers: {
            'Authorization': 'Bearer your-api-key',
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
        response: {
          status: 201,
          body: {
            id: 'webhook-123',
            event: 'patient.created',
            url: 'https://your-app.com/webhooks/patient-created',
            status: 'active',
            createdAt: '2024-01-15T10:30:00Z'
          }
        }
      }
    ]
  }
];

const SDK_EXAMPLES = {
  typescript: `import { HMHCPSDK } from '@hmhcp/sdk';

const sdk = new HMHCPSDK({
  apiKey: process.env.HMHCP_API_KEY,
  environment: 'production'
});

// Execute plugin
const result = await sdk.plugins.execute('patient-risk-assessment', {
  patientId: 'patient-123',
  data: patientData
});

// Register webhook
await sdk.webhooks.register({
  event: 'patient.created',
  url: 'https://your-app.com/webhooks/patient-created'
});`,

  javascript: `const { HMHCPSDK } = require('@hmhcp/sdk');

const sdk = new HMHCPSDK({
  apiKey: process.env.HMHCP_API_KEY,
  environment: 'production'
});

// Execute plugin
const result = await sdk.plugins.execute('patient-risk-assessment', {
  patientId: 'patient-123',
  data: patientData
});`,

  curl: `curl -X POST "https://api.hmhcp.com/api/plugins/developer/sdk/plugins/patient-risk-assessment/execute" \\
  -H "Authorization: Bearer your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "data": {
      "patientId": "patient-123",
      "vitalSigns": {
        "bloodPressure": { "systolic": 120, "diastolic": 80 },
        "heartRate": 72
      }
    },
    "sandbox": true
  }'`,

  python: `from hmhcp_sdk import HMHCPSDK

sdk = HMHCPSDK(
    api_key=os.getenv('HMHCP_API_KEY'),
    environment='production'
)

# Execute plugin
result = sdk.plugins.execute('patient-risk-assessment', {
    'patientId': 'patient-123',
    'data': patient_data
})`
};

export function InteractiveAPIDocs() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint>(API_ENDPOINTS[0]);
  const [selectedExample, setSelectedExample] = useState(0);
  const [selectedSDK, setSelectedSDK] = useState<'typescript' | 'javascript' | 'curl' | 'python'>('typescript');
  const [requestData, setRequestData] = useState<any>({});
  const [response, setResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleExecuteRequest = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Use example response
      const example = selectedEndpoint.examples[selectedExample];
      setResponse(example.response);
      
      toast.success('Request executed successfully');
    } catch (error) {
      toast.error('Request failed');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800';
      case 'POST': return 'bg-blue-100 text-blue-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      case 'PATCH': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Interactive API Documentation</h2>
          <p className="text-muted-foreground">
            Explore and test the HMHCP Developer API with real-time examples
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download SDK
          </Button>
          <Button variant="outline" size="sm">
            <BookOpen className="h-4 w-4 mr-2" />
            Full Docs
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Endpoint List */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">API Endpoints</CardTitle>
              <CardDescription>
                Select an endpoint to explore its documentation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {API_ENDPOINTS.map((endpoint) => (
                <div
                  key={endpoint.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedEndpoint.id === endpoint.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedEndpoint(endpoint)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={getMethodColor(endpoint.method)}>
                      {endpoint.method}
                    </Badge>
                    <Badge variant="outline">{endpoint.category}</Badge>
                  </div>
                  <h4 className="font-medium">{endpoint.name}</h4>
                  <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Endpoint Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Badge className={getMethodColor(selectedEndpoint.method)}>
                      {selectedEndpoint.method}
                    </Badge>
                    {selectedEndpoint.name}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {selectedEndpoint.description}
                  </CardDescription>
                </div>
                <Button
                  onClick={handleExecuteRequest}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  {isLoading ? 'Executing...' : 'Try It'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="parameters">Parameters</TabsTrigger>
                  <TabsTrigger value="examples">Examples</TabsTrigger>
                  <TabsTrigger value="sdk">SDK</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Endpoint</h4>
                    <code className="block p-3 bg-muted rounded-lg text-sm">
                      {selectedEndpoint.method} {selectedEndpoint.path}
                    </code>
                  </div>

                  {selectedEndpoint.parameters && selectedEndpoint.parameters.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Path Parameters</h4>
                      <div className="space-y-2">
                        {selectedEndpoint.parameters.map((param) => (
                          <div key={param.name} className="flex items-center justify-between p-2 bg-muted rounded">
                            <div>
                              <span className="font-mono text-sm">{param.name}</span>
                              <span className="text-muted-foreground text-sm ml-2">({param.type})</span>
                              {param.required && <Badge variant="destructive" className="ml-2">Required</Badge>}
                            </div>
                            <span className="text-sm text-muted-foreground">{param.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedEndpoint.requestBody && (
                    <div>
                      <h4 className="font-medium mb-2">Request Body</h4>
                      <div className="p-3 bg-muted rounded-lg">
                        <pre className="text-sm overflow-x-auto">
                          {JSON.stringify(selectedEndpoint.requestBody.example, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium mb-2">Responses</h4>
                    <div className="space-y-2">
                      {selectedEndpoint.responses.map((response) => (
                        <div key={response.status} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div className="flex items-center gap-2">
                            <Badge variant={response.status < 400 ? 'default' : 'destructive'}>
                              {response.status}
                            </Badge>
                            <span className="text-sm">{response.description}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="parameters" className="space-y-4">
                  {selectedEndpoint.parameters && selectedEndpoint.parameters.length > 0 ? (
                    <div className="space-y-4">
                      {selectedEndpoint.parameters.map((param) => (
                        <div key={param.name} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{param.name}</h4>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{param.type}</Badge>
                              {param.required && <Badge variant="destructive">Required</Badge>}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{param.description}</p>
                          {param.example && (
                            <div>
                              <Label className="text-xs font-medium">Example</Label>
                              <code className="block p-2 bg-muted rounded text-xs mt-1">
                                {JSON.stringify(param.example)}
                              </code>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No parameters for this endpoint.</p>
                  )}
                </TabsContent>

                <TabsContent value="examples" className="space-y-4">
                  <div className="space-y-4">
                    {selectedEndpoint.examples.map((example, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-medium">{example.name}</h4>
                            <p className="text-sm text-muted-foreground">{example.description}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedExample(index)}
                          >
                            {selectedExample === index ? 'Selected' : 'Select'}
                          </Button>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs font-medium">Request</Label>
                            <div className="relative">
                              <pre className="p-3 bg-muted rounded text-xs overflow-x-auto">
                                {JSON.stringify(example.request, null, 2)}
                              </pre>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={() => copyToClipboard(JSON.stringify(example.request, null, 2))}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          <div>
                            <Label className="text-xs font-medium">Response</Label>
                            <div className="relative">
                              <pre className="p-3 bg-muted rounded text-xs overflow-x-auto">
                                {JSON.stringify(example.response, null, 2)}
                              </pre>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={() => copyToClipboard(JSON.stringify(example.response, null, 2))}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="sdk" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">SDK Examples</h4>
                    <Select value={selectedSDK} onValueChange={(value: any) => setSelectedSDK(value)}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="typescript">TypeScript</SelectItem>
                        <SelectItem value="javascript">JavaScript</SelectItem>
                        <SelectItem value="curl">cURL</SelectItem>
                        <SelectItem value="python">Python</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="relative">
                    <pre className="p-4 bg-muted rounded-lg text-sm overflow-x-auto">
                      {SDK_EXAMPLES[selectedSDK]}
                    </pre>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(SDK_EXAMPLES[selectedSDK])}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Response Display */}
          {response && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Response
                </CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
