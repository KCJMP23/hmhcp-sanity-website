// Microsoft Graph Integration Management Component
// Source: architecture/source-tree.md

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { MicrosoftGraphOrganization, GraphAPIMonitoring } from '@/types/enterprise/graph-api';

interface GraphIntegrationProps {
  organizationId: string;
  onIntegrationUpdate?: (integration: any) => void;
}

export function GraphIntegration({ organizationId, onIntegrationUpdate }: GraphIntegrationProps) {
  const [organization, setOrganization] = useState<MicrosoftGraphOrganization | null>(null);
  const [monitoring, setMonitoring] = useState<GraphAPIMonitoring | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadGraphIntegration();
  }, [organizationId]);

  const loadGraphIntegration = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would fetch from the API
      const mockOrganization: MicrosoftGraphOrganization = {
        id: 'org-123',
        displayName: 'Healthcare Organization',
        description: 'Primary healthcare organization',
        organizationId,
        microsoftGraphId: 'graph-123',
        tenantId: 'tenant-123',
        verifiedDomains: ['healthcare.com'],
        createdDateTime: new Date().toISOString(),
        updatedDateTime: new Date().toISOString(),
        healthcareCompliance: {
          hipaaCompliant: true,
          fdaCompliant: true,
          fhirCompliant: true,
          hitrustCompliant: true,
          complianceLevel: 'enhanced',
          lastAuditDate: new Date().toISOString(),
          nextAuditDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          complianceOfficer: 'compliance@healthcare.com',
          auditTrail: [],
        },
        multiTenantConfig: {
          enabled: true,
          tenantId: 'tenant-123',
          organizationId,
          dataIsolation: 'strict',
          customBranding: true,
          whiteLabelSettings: {
            primaryColor: '#2563eb',
            secondaryColor: '#64748b',
            organizationName: 'Healthcare Organization',
            supportEmail: 'support@healthcare.com',
          },
          ssoConfig: {
            provider: 'azure_ad',
            enabled: true,
            configuration: {},
            healthcareRoleMapping: {},
            lastSyncDateTime: new Date().toISOString(),
          },
        },
      };

      const mockMonitoring: GraphAPIMonitoring = {
        healthStatus: 'healthy',
        lastHealthCheck: new Date().toISOString(),
        errorRate: 0.5,
        averageLatency: 150,
        quotaUtilization: 25,
        complianceStatus: 'compliant',
        alerts: [],
      };

      setOrganization(mockOrganization);
      setMonitoring(mockMonitoring);
    } catch (err) {
      setError('Failed to load Graph integration');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      // In a real implementation, this would test the connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Connection test successful!');
    } catch (err) {
      setError('Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const handleSyncUsers = async () => {
    try {
      setTesting(true);
      // In a real implementation, this would sync users
      await new Promise(resolve => setTimeout(resolve, 3000));
      alert('User sync completed successfully!');
    } catch (err) {
      setError('User sync failed');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div>Loading Graph integration...</div>;
  }

  if (!organization) {
    return <div>No Graph integration found</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Microsoft Graph Integration</CardTitle>
          <CardDescription>
            Manage Microsoft Graph API integration for your healthcare organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            {/* Organization Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Organization Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Display Name</Label>
                  <Input value={organization.displayName} readOnly />
                </div>
                <div>
                  <Label>Tenant ID</Label>
                  <Input value={organization.tenantId} readOnly />
                </div>
                <div>
                  <Label>Microsoft Graph ID</Label>
                  <Input value={organization.microsoftGraphId} readOnly />
                </div>
                <div>
                  <Label>Verified Domains</Label>
                  <div className="flex space-x-1">
                    {organization.verifiedDomains.map(domain => (
                      <Badge key={domain} variant="outline">{domain}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Healthcare Compliance */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Healthcare Compliance</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>HIPAA Compliant</span>
                    <Badge variant={organization.healthcareCompliance.hipaaCompliant ? 'default' : 'destructive'}>
                      {organization.healthcareCompliance.hipaaCompliant ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>FDA Compliant</span>
                    <Badge variant={organization.healthcareCompliance.fdaCompliant ? 'default' : 'destructive'}>
                      {organization.healthcareCompliance.fdaCompliant ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>FHIR Compliant</span>
                    <Badge variant={organization.healthcareCompliance.fhirCompliant ? 'default' : 'destructive'}>
                      {organization.healthcareCompliance.fhirCompliant ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>HITRUST Compliant</span>
                    <Badge variant={organization.healthcareCompliance.hitrustCompliant ? 'default' : 'destructive'}>
                      {organization.healthcareCompliance.hitrustCompliant ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <Label>Compliance Level</Label>
                    <Badge variant="outline">{organization.healthcareCompliance.complianceLevel}</Badge>
                  </div>
                  <div>
                    <Label>Last Audit</Label>
                    <span className="text-sm text-gray-500">
                      {new Date(organization.healthcareCompliance.lastAuditDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <Label>Next Audit</Label>
                    <span className="text-sm text-gray-500">
                      {new Date(organization.healthcareCompliance.nextAuditDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <Label>Compliance Officer</Label>
                    <span className="text-sm text-gray-500">
                      {organization.healthcareCompliance.complianceOfficer}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Multi-Tenant Configuration */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Multi-Tenant Configuration</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Multi-Tenant Enabled</span>
                  <Switch checked={organization.multiTenantConfig.enabled} disabled />
                </div>
                <div className="flex items-center justify-between">
                  <span>Custom Branding</span>
                  <Switch checked={organization.multiTenantConfig.customBranding} disabled />
                </div>
                <div>
                  <Label>Data Isolation</Label>
                  <Badge variant="outline">{organization.multiTenantConfig.dataIsolation}</Badge>
                </div>
                <div>
                  <Label>Organization Name</Label>
                  <Input value={organization.multiTenantConfig.whiteLabelSettings.organizationName} readOnly />
                </div>
                <div>
                  <Label>Support Email</Label>
                  <Input value={organization.multiTenantConfig.whiteLabelSettings.supportEmail} readOnly />
                </div>
              </div>
            </div>

            {/* API Monitoring */}
            {monitoring && (
              <div>
                <h3 className="text-lg font-semibold mb-3">API Monitoring</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Health Status</span>
                      <Badge variant={monitoring.healthStatus === 'healthy' ? 'default' : 'destructive'}>
                        {monitoring.healthStatus}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Error Rate</span>
                      <span className="text-sm text-gray-500">{monitoring.errorRate}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Average Latency</span>
                      <span className="text-sm text-gray-500">{monitoring.averageLatency}ms</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <Label>Quota Utilization</Label>
                      <div className="mt-1">
                        <Progress value={monitoring.quotaUtilization} className="w-full" />
                        <span className="text-sm text-gray-500">{monitoring.quotaUtilization}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Compliance Status</span>
                      <Badge variant={monitoring.complianceStatus === 'compliant' ? 'default' : 'destructive'}>
                        {monitoring.complianceStatus}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-4 pt-4">
              <Button
                onClick={handleTestConnection}
                disabled={testing}
                variant="outline"
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </Button>
              <Button
                onClick={handleSyncUsers}
                disabled={testing}
                variant="outline"
              >
                {testing ? 'Syncing...' : 'Sync Users'}
              </Button>
              <Button>
                Save Configuration
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
