/**
 * Advanced Security Features Component
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Lock, 
  AlertTriangle, 
  CheckCircle,
  Activity,
  BarChart3,
  Settings,
  Play,
  Download
} from 'lucide-react';

interface SecurityEvent {
  id: string;
  timestamp: string;
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  target: string;
  details: any;
  healthcareImpact: boolean;
  complianceFlags: string[];
  resolved: boolean;
}

interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  type: 'authentication' | 'authorization' | 'encryption' | 'audit' | 'compliance';
  enabled: boolean;
  healthcareSpecific: boolean;
  priority: number;
}

interface SecurityAudit {
  id: string;
  organizationId: string;
  auditType: 'security' | 'compliance' | 'access' | 'data';
  startTime: string;
  endTime: string;
  findings: any[];
  recommendations: string[];
  complianceScore: number;
  healthcareCompliance: boolean;
}

export default function SecurityComponent() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [policies, setPolicies] = useState<SecurityPolicy[]>([]);
  const [audits, setAudits] = useState<SecurityAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      // Mock data for now
      setEvents([
        {
          id: '1',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          eventType: 'oauth_token_exchange',
          severity: 'medium',
          source: 'oauth_client',
          target: 'token_endpoint',
          details: { clientId: 'healthcare-client-123' },
          healthcareImpact: true,
          complianceFlags: ['OAUTH_AUDIT_REQUIRED'],
          resolved: false
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          eventType: 'failed_authentication',
          severity: 'high',
          source: 'api_gateway',
          target: 'auth_service',
          details: { attempts: 5, ipAddress: '192.168.1.100' },
          healthcareImpact: true,
          complianceFlags: ['HIPAA_AUDIT_REQUIRED'],
          resolved: true
        }
      ]);

      setPolicies([
        {
          id: '1',
          name: 'Healthcare Data Access Policy',
          description: 'Controls access to healthcare data with HIPAA compliance',
          type: 'authorization',
          enabled: true,
          healthcareSpecific: true,
          priority: 1
        },
        {
          id: '2',
          name: 'OAuth 2.0 PKCE Policy',
          description: 'Enforces PKCE for all OAuth 2.0 flows',
          type: 'authentication',
          enabled: true,
          healthcareSpecific: true,
          priority: 2
        }
      ]);

      setAudits([
        {
          id: '1',
          organizationId: 'org-123',
          auditType: 'compliance',
          startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          findings: [
            {
              id: '1',
              severity: 'high',
              category: 'HIPAA',
              description: 'Missing audit logging for patient data access',
              recommendation: 'Enable comprehensive audit logging',
              healthcareImpact: true,
              complianceViolation: true
            }
          ],
          recommendations: ['Enable comprehensive audit logging'],
          complianceScore: 85,
          healthcareCompliance: true
        }
      ]);
    } catch (err) {
      setError('Failed to load security data');
    } finally {
      setLoading(false);
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

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'authentication': return <Lock className="h-4 w-4" />;
      case 'authorization': return <Shield className="h-4 w-4" />;
      case 'encryption': return <Lock className="h-4 w-4" />;
      case 'audit': return <Activity className="h-4 w-4" />;
      case 'compliance': return <CheckCircle className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
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
          <h2 className="text-2xl font-bold text-gray-900">Security Management</h2>
          <p className="text-gray-600">Advanced security features with OAuth 2.0 PKCE and healthcare compliance</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Play className="h-4 w-4 mr-2" />
            Run Audit
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="audits">Audits</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Security Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Policies</p>
                    <p className="text-2xl font-bold text-gray-900">{policies.filter(p => p.enabled).length}</p>
                  </div>
                  <Shield className="h-8 w-8 text-blue-600" />
                </div>
                <div className="mt-2">
                  <Badge variant="outline" className="text-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    All Active
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Security Events</p>
                    <p className="text-2xl font-bold text-gray-900">{events.length}</p>
                  </div>
                  <Activity className="h-8 w-8 text-orange-600" />
                </div>
                <div className="mt-2">
                  <Badge variant="outline" className="text-red-600">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {events.filter(e => !e.resolved).length} Unresolved
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Compliance Score</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {audits.length > 0 ? audits[0].complianceScore : 0}%
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div className="mt-2">
                  <Badge variant="outline" className="text-green-600">
                    <Shield className="h-3 w-3 mr-1" />
                    HIPAA Compliant
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">OAuth 2.0 PKCE</p>
                    <p className="text-2xl font-bold text-green-600">Enabled</p>
                  </div>
                  <Lock className="h-8 w-8 text-green-600" />
                </div>
                <div className="mt-2">
                  <Badge variant="outline" className="text-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Secure
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Security Events */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Events</CardTitle>
              <CardDescription>Latest security events and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {events.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge className={getSeverityColor(event.severity)}>
                        {getSeverityIcon(event.severity)}
                        <span className="ml-1 capitalize">{event.severity}</span>
                      </Badge>
                      <div>
                        <p className="font-medium">{event.eventType.replace(/_/g, ' ')}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {event.healthcareImpact && (
                        <Badge variant="outline" className="text-red-600">
                          <Shield className="h-3 w-3 mr-1" />
                          Healthcare Impact
                        </Badge>
                      )}
                      {event.resolved ? (
                        <Badge variant="outline" className="text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Resolved
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-yellow-600">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Events</CardTitle>
              <CardDescription>All security events and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {events.map((event) => (
                  <Card key={event.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Badge className={getSeverityColor(event.severity)}>
                            {getSeverityIcon(event.severity)}
                            <span className="ml-1 capitalize">{event.severity}</span>
                          </Badge>
                          <div>
                            <p className="font-medium">{event.eventType.replace(/_/g, ' ')}</p>
                            <p className="text-sm text-gray-500">
                              {event.source} → {event.target}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {event.healthcareImpact && (
                            <Badge variant="outline" className="text-red-600">
                              <Shield className="h-3 w-3 mr-1" />
                              Healthcare Impact
                            </Badge>
                          )}
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <p>Timestamp: {new Date(event.timestamp).toLocaleString()}</p>
                        <p>Compliance Flags: {event.complianceFlags.join(', ')}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Policies</CardTitle>
              <CardDescription>Configure security policies and rules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {policies.map((policy) => (
                  <Card key={policy.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getTypeIcon(policy.type)}
                          <div>
                            <p className="font-medium">{policy.name}</p>
                            <p className="text-sm text-gray-500">{policy.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            {policy.type.toUpperCase()}
                          </Badge>
                          {policy.healthcareSpecific && (
                            <Badge variant="outline" className="text-green-600">
                              <Shield className="h-3 w-3 mr-1" />
                              Healthcare
                            </Badge>
                          )}
                          <Badge variant={policy.enabled ? 'default' : 'secondary'}>
                            {policy.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                          <Button size="sm" variant="outline">
                            Configure
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Audits</CardTitle>
              <CardDescription>Security audit results and compliance reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {audits.map((audit) => (
                  <Card key={audit.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{audit.auditType.toUpperCase()} Audit</p>
                          <p className="text-sm text-gray-500">
                            {new Date(audit.startTime).toLocaleDateString()} - {new Date(audit.endTime).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-green-600">
                            {audit.complianceScore}% Score
                          </Badge>
                          {audit.healthcareCompliance && (
                            <Badge variant="outline" className="text-green-600">
                              <Shield className="h-3 w-3 mr-1" />
                              HIPAA Compliant
                            </Badge>
                          )}
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Download Report
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          Findings: {audit.findings.length} | Recommendations: {audit.recommendations.length}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
