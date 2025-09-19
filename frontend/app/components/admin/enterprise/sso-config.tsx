/**
 * Enterprise SSO Configuration Component
 * Healthcare-compliant SSO provider configuration interface
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Users, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  Plus,
  Edit,
  Trash2,
  TestTube
} from 'lucide-react';

interface SSOProvider {
  id: string;
  name: string;
  type: string;
  displayName: string;
  isActive: boolean;
  isDefault: boolean;
  healthcareCompliance: {
    hipaaCompliance: boolean;
    dataEncryption: {
      inTransit: boolean;
      atRest: boolean;
    };
    auditLogging: {
      enabled: boolean;
      logLevel: string;
    };
  };
}

interface SSOConfigProps {
  organizationId: string;
}

export default function SSOConfigComponent({ organizationId }: SSOConfigProps) {
  const [providers, setProviders] = useState<SSOProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [editingProvider, setEditingProvider] = useState<SSOProvider | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    displayName: '',
    clientId: '',
    clientSecret: '',
    tenantId: '',
    domain: '',
    redirectUri: '',
    scopes: ['openid', 'profile', 'email'],
    hipaaCompliant: true,
    dataEncryptionInTransit: true,
    dataEncryptionAtRest: true,
    auditLoggingEnabled: true,
    auditLogLevel: 'comprehensive'
  });

  useEffect(() => {
    loadProviders();
  }, [organizationId]);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/enterprise/sso/providers?organizationId=${organizationId}`);
      const data = await response.json();
      
      if (data.success) {
        setProviders(data.providers);
      } else {
        setError(data.error?.message || 'Failed to load SSO providers');
      }
    } catch (err) {
      setError('Failed to load SSO providers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/enterprise/sso/providers', {
        method: editingProvider ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          organizationId,
          id: editingProvider?.id
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(editingProvider ? 'SSO provider updated successfully' : 'SSO provider created successfully');
        setShowAddProvider(false);
        setEditingProvider(null);
        resetForm();
        loadProviders();
      } else {
        setError(data.error?.message || 'Failed to save SSO provider');
      }
    } catch (err) {
      setError('Failed to save SSO provider');
    }
  };

  const handleEdit = (provider: SSOProvider) => {
    setEditingProvider(provider);
    setFormData({
      name: provider.name,
      type: provider.type,
      displayName: provider.displayName,
      clientId: '',
      clientSecret: '',
      tenantId: '',
      domain: '',
      redirectUri: '',
      scopes: ['openid', 'profile', 'email'],
      hipaaCompliant: provider.healthcareCompliance.hipaaCompliance,
      dataEncryptionInTransit: provider.healthcareCompliance.dataEncryption.inTransit,
      dataEncryptionAtRest: provider.healthcareCompliance.dataEncryption.atRest,
      auditLoggingEnabled: provider.healthcareCompliance.auditLogging.enabled,
      auditLogLevel: provider.healthcareCompliance.auditLogging.logLevel
    });
    setShowAddProvider(true);
  };

  const handleDelete = async (providerId: string) => {
    if (!confirm('Are you sure you want to delete this SSO provider?')) return;

    try {
      const response = await fetch(`/api/enterprise/sso/providers/${providerId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('SSO provider deleted successfully');
        loadProviders();
      } else {
        setError(data.error?.message || 'Failed to delete SSO provider');
      }
    } catch (err) {
      setError('Failed to delete SSO provider');
    }
  };

  const handleTest = async (providerId: string) => {
    try {
      const response = await fetch(`/api/enterprise/sso/providers/${providerId}/test`, {
        method: 'POST',
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('SSO provider test successful');
      } else {
        setError(data.error?.message || 'SSO provider test failed');
      }
    } catch (err) {
      setError('Failed to test SSO provider');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      displayName: '',
      clientId: '',
      clientSecret: '',
      tenantId: '',
      domain: '',
      redirectUri: '',
      scopes: ['openid', 'profile', 'email'],
      hipaaCompliant: true,
      dataEncryptionInTransit: true,
      dataEncryptionAtRest: true,
      auditLoggingEnabled: true,
      auditLogLevel: 'comprehensive'
    });
  };

  const getProviderTypeIcon = (type: string) => {
    switch (type) {
      case 'microsoft_365':
        return '🔷';
      case 'google_workspace':
        return '🔴';
      case 'okta':
        return '🟢';
      case 'azure_ad':
        return '🔵';
      default:
        return '🔐';
    }
  };

  const getComplianceStatus = (provider: SSOProvider) => {
    const { hipaaCompliance, dataEncryption, auditLogging } = provider.healthcareCompliance;
    
    if (hipaaCompliance && dataEncryption.inTransit && dataEncryption.atRest && auditLogging.enabled) {
      return { status: 'compliant', label: 'HIPAA Compliant', color: 'green' };
    } else if (hipaaCompliance && (dataEncryption.inTransit || dataEncryption.atRest)) {
      return { status: 'partial', label: 'Partially Compliant', color: 'yellow' };
    } else {
      return { status: 'non-compliant', label: 'Non-Compliant', color: 'red' };
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
          <h2 className="text-2xl font-bold text-gray-900">SSO Configuration</h2>
          <p className="text-gray-600">Manage Single Sign-On providers for your healthcare organization</p>
        </div>
        <Button onClick={() => setShowAddProvider(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Provider
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {providers.map((provider) => {
          const compliance = getComplianceStatus(provider);
          return (
            <Card key={provider.id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getProviderTypeIcon(provider.type)}</span>
                    <div>
                      <CardTitle className="text-lg">{provider.displayName}</CardTitle>
                      <CardDescription>{provider.name} • {provider.type}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={compliance.color === 'green' ? 'default' : compliance.color === 'yellow' ? 'secondary' : 'destructive'}
                      className="bg-green-100 text-green-800"
                    >
                      {compliance.label}
                    </Badge>
                    {provider.isDefault && (
                      <Badge variant="outline">Default</Badge>
                    )}
                    {provider.isActive ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">HIPAA Compliance</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      {provider.healthcareCompliance.hipaaCompliance ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-sm">
                        {provider.healthcareCompliance.hipaaCompliance ? 'Compliant' : 'Non-Compliant'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Data Encryption</Label>
                    <div className="text-sm text-gray-600 mt-1">
                      {provider.healthcareCompliance.dataEncryption.inTransit ? 'In Transit ✓' : 'In Transit ✗'} • {' '}
                      {provider.healthcareCompliance.dataEncryption.atRest ? 'At Rest ✓' : 'At Rest ✗'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Audit Logging</Label>
                    <div className="text-sm text-gray-600 mt-1">
                      {provider.healthcareCompliance.auditLogging.enabled ? 'Enabled' : 'Disabled'} • {' '}
                      {provider.healthcareCompliance.auditLogging.logLevel}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(provider)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTest(provider.id)}
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    Test
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(provider.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showAddProvider && (
        <Card>
          <CardHeader>
            <CardTitle>{editingProvider ? 'Edit SSO Provider' : 'Add New SSO Provider'}</CardTitle>
            <CardDescription>
              Configure a new Single Sign-On provider for your healthcare organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Settings</TabsTrigger>
                  <TabsTrigger value="security">Security & Compliance</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Provider Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Microsoft 365"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Provider Type</Label>
                      <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="microsoft_365">Microsoft 365</SelectItem>
                          <SelectItem value="google_workspace">Google Workspace</SelectItem>
                          <SelectItem value="okta">Okta</SelectItem>
                          <SelectItem value="azure_ad">Azure AD</SelectItem>
                          <SelectItem value="saml">SAML</SelectItem>
                          <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                          <SelectItem value="openid_connect">OpenID Connect</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        value={formData.displayName}
                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                        placeholder="e.g., Company SSO"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="clientId">Client ID</Label>
                      <Input
                        id="clientId"
                        value={formData.clientId}
                        onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                        placeholder="Your OAuth client ID"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="clientSecret">Client Secret</Label>
                      <Input
                        id="clientSecret"
                        type="password"
                        value={formData.clientSecret}
                        onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
                        placeholder="Your OAuth client secret"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="redirectUri">Redirect URI</Label>
                      <Input
                        id="redirectUri"
                        value={formData.redirectUri}
                        onChange={(e) => setFormData({ ...formData, redirectUri: e.target.value })}
                        placeholder="https://yourdomain.com/auth/callback"
                        required
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="security" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="hipaaCompliant">HIPAA Compliance</Label>
                        <p className="text-sm text-gray-600">Ensure this provider meets HIPAA requirements</p>
                      </div>
                      <Switch
                        id="hipaaCompliant"
                        checked={formData.hipaaCompliant}
                        onCheckedChange={(checked) => setFormData({ ...formData, hipaaCompliant: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="dataEncryptionInTransit">Data Encryption in Transit</Label>
                        <p className="text-sm text-gray-600">Encrypt data during transmission</p>
                      </div>
                      <Switch
                        id="dataEncryptionInTransit"
                        checked={formData.dataEncryptionInTransit}
                        onCheckedChange={(checked) => setFormData({ ...formData, dataEncryptionInTransit: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="dataEncryptionAtRest">Data Encryption at Rest</Label>
                        <p className="text-sm text-gray-600">Encrypt data when stored</p>
                      </div>
                      <Switch
                        id="dataEncryptionAtRest"
                        checked={formData.dataEncryptionAtRest}
                        onCheckedChange={(checked) => setFormData({ ...formData, dataEncryptionAtRest: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="auditLoggingEnabled">Audit Logging</Label>
                        <p className="text-sm text-gray-600">Enable comprehensive audit logging</p>
                      </div>
                      <Switch
                        id="auditLoggingEnabled"
                        checked={formData.auditLoggingEnabled}
                        onCheckedChange={(checked) => setFormData({ ...formData, auditLoggingEnabled: checked })}
                      />
                    </div>
                    {formData.auditLoggingEnabled && (
                      <div>
                        <Label htmlFor="auditLogLevel">Audit Log Level</Label>
                        <Select 
                          value={formData.auditLogLevel} 
                          onValueChange={(value) => setFormData({ ...formData, auditLogLevel: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="basic">Basic</SelectItem>
                            <SelectItem value="detailed">Detailed</SelectItem>
                            <SelectItem value="comprehensive">Comprehensive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="advanced" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tenantId">Tenant ID (Optional)</Label>
                      <Input
                        id="tenantId"
                        value={formData.tenantId}
                        onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                        placeholder="Azure AD tenant ID"
                      />
                    </div>
                    <div>
                      <Label htmlFor="domain">Domain (Optional)</Label>
                      <Input
                        id="domain"
                        value={formData.domain}
                        onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                        placeholder="yourcompany.com"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="flex items-center justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddProvider(false);
                    setEditingProvider(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingProvider ? 'Update Provider' : 'Create Provider'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}