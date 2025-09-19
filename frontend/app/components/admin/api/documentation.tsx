/**
 * API Documentation Component
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BookOpen, 
  Code, 
  Play, 
  Copy,
  CheckCircle,
  AlertTriangle,
  Shield,
  Activity
} from 'lucide-react';

interface APIEndpoint {
  path: string;
  method: string;
  description: string;
  parameters: any[];
  responses: any[];
  examples: any[];
  healthcareContext: any;
  compliance: any;
}

export default function APIDocumentationComponent() {
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadEndpoints();
  }, []);

  const loadEndpoints = async () => {
    try {
      setLoading(true);
      // Mock data for now
      setEndpoints([
        {
          path: '/api/enterprise/graph/users',
          method: 'GET',
          description: 'Get Microsoft Graph users with healthcare context',
          parameters: [
            {
              name: 'organizationId',
              type: 'string',
              required: true,
              description: 'Organization identifier',
              example: 'org-123'
            }
          ],
          responses: [
            {
              statusCode: 200,
              description: 'Success',
              example: { users: [] }
            }
          ],
          examples: [],
          healthcareContext: {
            clinicalAccess: true,
            administrativeAccess: true,
            billingAccess: false,
            reportingAccess: true,
            complianceLevel: 'hipaa',
            dataAccessLevel: 'read',
            auditRequired: true
          },
          compliance: {
            hipaaCompliant: true,
            fhirCompliant: false,
            auditRequired: true,
            dataEncryption: true,
            accessLogging: true
          }
        },
        {
          path: '/api/enterprise/fhir/Patient',
          method: 'GET',
          description: 'Get FHIR Patient resources',
          parameters: [
            {
              name: 'organizationId',
              type: 'string',
              required: true,
              description: 'Organization identifier',
              example: 'org-123'
            }
          ],
          responses: [
            {
              statusCode: 200,
              description: 'Success',
              example: { patients: [] }
            }
          ],
          examples: [],
          healthcareContext: {
            clinicalAccess: true,
            administrativeAccess: false,
            billingAccess: false,
            reportingAccess: true,
            complianceLevel: 'hipaa',
            dataAccessLevel: 'read',
            auditRequired: true
          },
          compliance: {
            hipaaCompliant: true,
            fhirCompliant: true,
            auditRequired: true,
            dataEncryption: true,
            accessLogging: true
          }
        }
      ]);
    } catch (err) {
      setError('Failed to load API endpoints');
    } finally {
      setLoading(false);
    }
  };

  const testEndpoint = async (endpoint: APIEndpoint) => {
    try {
      setTesting(true);
      setTestResult(null);

      const response = await fetch('/api/enterprise/documentation/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: endpoint.path,
          method: endpoint.method,
          parameters: { organizationId: 'org-123' }
        })
      });

      const result = await response.json();
      setTestResult(result);
    } catch (err) {
      setTestResult({
        success: false,
        error: 'Test failed'
      });
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800';
      case 'POST': return 'bg-blue-100 text-blue-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">API Documentation</h2>
          <p className="text-gray-600">Interactive API documentation with healthcare-specific examples</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <BookOpen className="h-4 w-4 mr-2" />
            OpenAPI Spec
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Code className="h-4 w-4 mr-2" />
            Generate SDK
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {/* API Endpoints List */}
        <Card>
          <CardHeader>
            <CardTitle>API Endpoints</CardTitle>
            <CardDescription>
              Available healthcare-compliant API endpoints
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {endpoints.map((endpoint, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedEndpoint(endpoint)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge className={getMethodColor(endpoint.method)}>
                        {endpoint.method}
                      </Badge>
                      <code className="text-sm font-mono">{endpoint.path}</code>
                    </div>
                    <div className="flex items-center space-x-2">
                      {endpoint.compliance.hipaaCompliant && (
                        <Badge variant="outline" className="text-green-600">
                          <Shield className="h-3 w-3 mr-1" />
                          HIPAA
                        </Badge>
                      )}
                      {endpoint.compliance.fhirCompliant && (
                        <Badge variant="outline" className="text-blue-600">
                          FHIR
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{endpoint.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Selected Endpoint Details */}
        {selectedEndpoint && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-3">
                    <Badge className={getMethodColor(selectedEndpoint.method)}>
                      {selectedEndpoint.method}
                    </Badge>
                    <code className="text-lg font-mono">{selectedEndpoint.path}</code>
                  </CardTitle>
                  <CardDescription>{selectedEndpoint.description}</CardDescription>
                </div>
                <Button
                  onClick={() => testEndpoint(selectedEndpoint)}
                  disabled={testing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {testing ? 'Testing...' : 'Test Endpoint'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="parameters">Parameters</TabsTrigger>
                  <TabsTrigger value="examples">Examples</TabsTrigger>
                  <TabsTrigger value="test">Test Results</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Healthcare Context</Label>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Clinical Access: {selectedEndpoint.healthcareContext.clinicalAccess ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Administrative Access: {selectedEndpoint.healthcareContext.administrativeAccess ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Compliance Level: {selectedEndpoint.healthcareContext.complianceLevel}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Compliance</Label>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center space-x-2">
                          {selectedEndpoint.compliance.hipaaCompliant ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm">HIPAA Compliant</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {selectedEndpoint.compliance.fhirCompliant ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm">FHIR Compliant</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Data Encryption</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="parameters" className="space-y-4">
                  <div className="space-y-4">
                    {selectedEndpoint.parameters.map((param, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <code className="text-sm font-mono">{param.name}</code>
                            <span className="ml-2 text-sm text-gray-500">({param.type})</span>
                            {param.required && (
                              <Badge variant="destructive" className="ml-2">Required</Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{param.description}</p>
                        <p className="text-xs text-gray-500 mt-1">Example: {param.example}</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="examples" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">JavaScript</Label>
                      <div className="mt-2 relative">
                        <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                          <code>{`// ${selectedEndpoint.description}
const response = await fetch('${process.env.NEXT_PUBLIC_API_URL}${selectedEndpoint.path}', {
  method: '${selectedEndpoint.method}',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);`}</code>
                        </pre>
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(`// ${selectedEndpoint.description}\nconst response = await fetch('${process.env.NEXT_PUBLIC_API_URL}${selectedEndpoint.path}', {\n  method: '${selectedEndpoint.method}',\n  headers: {\n    'Authorization': 'Bearer YOUR_TOKEN',\n    'Content-Type': 'application/json'\n  }\n});\n\nconst data = await response.json();\nconsole.log(data);`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="test" className="space-y-4">
                  {testResult ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        {testResult.success ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        )}
                        <span className="font-medium">
                          {testResult.success ? 'Test Successful' : 'Test Failed'}
                        </span>
                      </div>
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <pre className="text-sm overflow-x-auto">
                          {JSON.stringify(testResult, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Click "Test Endpoint" to run a test</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
