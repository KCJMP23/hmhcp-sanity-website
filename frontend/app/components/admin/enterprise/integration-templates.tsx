/**
 * Healthcare System Integration Templates Component
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Shield,
  Play,
  Download,
  BookOpen,
  Users,
  AlertTriangle
} from 'lucide-react';

interface IntegrationTemplate {
  id: string;
  name: string;
  systemType: 'epic' | 'cerner' | 'allscripts' | 'custom';
  version: string;
  description: string;
  features: string[];
  requirements: any[];
  configuration: any;
  setupSteps: any[];
  testing: any;
  compliance: any;
  support: any;
}

export default function IntegrationTemplatesComponent() {
  const [templates, setTemplates] = useState<IntegrationTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<IntegrationTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      // Mock data for now
      setTemplates([
        {
          id: 'epic-template',
          name: 'Epic MyChart Integration',
          systemType: 'epic',
          version: '1.0.0',
          description: 'Complete integration template for Epic MyChart system with FHIR R4 compliance',
          features: [
            'Patient data synchronization',
            'Appointment scheduling',
            'Clinical notes integration',
            'Medication management',
            'Lab results access',
            'FHIR R4 compliance',
            'HIPAA compliance',
            'Real-time data sync'
          ],
          requirements: [
            {
              id: 'req-1',
              name: 'Epic MyChart API Access',
              description: 'Valid Epic MyChart API credentials and endpoint access',
              type: 'software',
              required: true,
              healthcareSpecific: true,
              estimatedCost: 5000,
              estimatedTime: '2-4 weeks'
            }
          ],
          configuration: {},
          setupSteps: [],
          testing: {},
          compliance: {
            standards: ['HIPAA', 'FHIR R4', 'HL7'],
            certifications: ['Epic MyChart Certified']
          },
          support: {
            healthcareSupport: true,
            supportChannels: ['Email', 'Phone', 'Epic Support Portal']
          }
        },
        {
          id: 'cerner-template',
          name: 'Cerner PowerChart Integration',
          systemType: 'cerner',
          version: '1.0.0',
          description: 'Integration template for Cerner PowerChart with HL7 and FHIR support',
          features: [
            'Patient demographics sync',
            'Clinical documentation',
            'Order management',
            'Results reporting',
            'HL7 message processing',
            'FHIR R4 compliance'
          ],
          requirements: [
            {
              id: 'req-1',
              name: 'Cerner API Access',
              description: 'Cerner Developer Portal access and API credentials',
              type: 'software',
              required: true,
              healthcareSpecific: true,
              estimatedCost: 3000,
              estimatedTime: '2-3 weeks'
            }
          ],
          configuration: {},
          setupSteps: [],
          testing: {},
          compliance: {
            standards: ['HL7', 'FHIR R4'],
            certifications: []
          },
          support: {
            healthcareSupport: false,
            supportChannels: ['Email', 'Cerner Support Portal']
          }
        },
        {
          id: 'allscripts-template',
          name: 'Allscripts Integration',
          systemType: 'allscripts',
          version: '1.0.0',
          description: 'Integration template for Allscripts EHR system',
          features: [
            'Patient data integration',
            'Clinical workflow support',
            'Medication management'
          ],
          requirements: [
            {
              id: 'req-1',
              name: 'Allscripts API Access',
              description: 'Allscripts API credentials and endpoint access',
              type: 'software',
              required: true,
              healthcareSpecific: true,
              estimatedCost: 2000,
              estimatedTime: '1-2 weeks'
            }
          ],
          configuration: {},
          setupSteps: [],
          testing: {},
          compliance: {
            standards: ['HL7'],
            certifications: []
          },
          support: {
            healthcareSupport: false,
            supportChannels: ['Email']
          }
        }
      ]);
    } catch (err) {
      setError('Failed to load integration templates');
    } finally {
      setLoading(false);
    }
  };

  const getSystemIcon = (systemType: string) => {
    switch (systemType) {
      case 'epic': return '🔷';
      case 'cerner': return '🟢';
      case 'allscripts': return '🟡';
      default: return '🔧';
    }
  };

  const getSystemColor = (systemType: string) => {
    switch (systemType) {
      case 'epic': return 'bg-blue-100 text-blue-800';
      case 'cerner': return 'bg-green-100 text-green-800';
      case 'allscripts': return 'bg-yellow-100 text-yellow-800';
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
          <h2 className="text-2xl font-bold text-gray-900">Integration Templates</h2>
          <p className="text-gray-600">Pre-built templates for popular healthcare systems</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Building2 className="h-4 w-4 mr-2" />
          Create Custom Template
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{getSystemIcon(template.systemType)}</span>
                  <div>
                    <CardTitle className="text-xl">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getSystemColor(template.systemType)}>
                    {template.systemType.toUpperCase()}
                  </Badge>
                  <Badge variant="outline">v{template.version}</Badge>
                  {template.support.healthcareSupport && (
                    <Badge variant="outline" className="text-green-600">
                      <Shield className="h-3 w-3 mr-1" />
                      Healthcare Support
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Key Features</h4>
                  <div className="flex flex-wrap gap-2">
                    {template.features.map((feature, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Requirements</h4>
                    <div className="space-y-1">
                      {template.requirements.map((req, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{req.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Compliance</h4>
                    <div className="space-y-1">
                      {template.compliance.standards.map((standard, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {standard}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Support</h4>
                    <div className="space-y-1">
                      {template.support.supportChannels.map((channel, index) => (
                        <div key={index} className="text-sm text-gray-600">
                          {channel}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => setSelectedTemplate(template)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Configure Integration
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                  <Button variant="outline">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Documentation
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Template Details Modal */}
      {selectedTemplate && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getSystemIcon(selectedTemplate.systemType)}</span>
                <div>
                  <CardTitle>{selectedTemplate.name}</CardTitle>
                  <CardDescription>v{selectedTemplate.version}</CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setSelectedTemplate(null)}
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="requirements">Requirements</TabsTrigger>
                <TabsTrigger value="configuration">Configuration</TabsTrigger>
                <TabsTrigger value="testing">Testing</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-600">{selectedTemplate.description}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Features</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedTemplate.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="requirements" className="space-y-4">
                <div className="space-y-4">
                  {selectedTemplate.requirements.map((req, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{req.name}</h4>
                            <p className="text-sm text-gray-600">{req.description}</p>
                          </div>
                          <div className="text-right">
                            {req.estimatedCost && (
                              <div className="flex items-center space-x-1 text-sm text-gray-600">
                                <DollarSign className="h-4 w-4" />
                                <span>${req.estimatedCost.toLocaleString()}</span>
                              </div>
                            )}
                            {req.estimatedTime && (
                              <div className="flex items-center space-x-1 text-sm text-gray-600">
                                <Clock className="h-4 w-4" />
                                <span>{req.estimatedTime}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex items-center space-x-2">
                          <Badge variant={req.required ? 'destructive' : 'secondary'}>
                            {req.required ? 'Required' : 'Optional'}
                          </Badge>
                          {req.healthcareSpecific && (
                            <Badge variant="outline" className="text-green-600">
                              <Shield className="h-3 w-3 mr-1" />
                              Healthcare Specific
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="configuration" className="space-y-4">
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Configuration interface will be displayed here</p>
                  <p className="text-sm">Interactive configuration form for {selectedTemplate.name}</p>
                </div>
              </TabsContent>

              <TabsContent value="testing" className="space-y-4">
                <div className="text-center py-8 text-gray-500">
                  <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Testing guide will be displayed here</p>
                  <p className="text-sm">Comprehensive testing procedures for {selectedTemplate.name}</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
