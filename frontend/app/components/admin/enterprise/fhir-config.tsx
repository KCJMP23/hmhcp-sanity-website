/**
 * FHIR Compliance Configuration Component
 * Healthcare-compliant FHIR endpoint configuration interface
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
  Database, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  Plus,
  Edit,
  Trash2,
  TestTube,
  Activity
} from 'lucide-react';

interface FHIREndpoint {
  id: string;
  name: string;
  baseUrl: string;
  version: 'R4' | 'R5';
  isActive: boolean;
  isDefault: boolean;
  healthcareCompliance: {
    hipaaCompliant: boolean;
    dataEncryption: {
      inTransit: boolean;
      atRest: boolean;
    };
    auditLogging: {
      enabled: boolean;
      logLevel: 'basic' | 'detailed' | 'comprehensive';
    };
    accessControls: {
      rbac: boolean;
      abac: boolean;
      mfa: boolean;
    };
  };
  authentication: {
    type: 'none' | 'basic' | 'bearer' | 'oauth2' | 'saml';
    username?: string;
    clientId?: string;
    scope?: string;
  };
  lastTested?: string;
  status: 'connected' | 'disconnected' | 'error' | 'testing';
}

interface FHIRConfigProps {
  organizationId: string;
}

export default function FHIRConfigComponent({ organizationId }: FHIRConfigProps) {
  const [endpoints, setEndpoints] = useState<FHIREndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddEndpoint, setShowAddEndpoint] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<FHIREndpoint | null>(null);
  const [testingEndpoint, setTestingEndpoint] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    baseUrl: '',
    version: 'R4' as 'R4' | 'R5',
    hipaaCompliant: true,
    dataEncryptionInTransit: true,
    dataEncryptionAtRest: true,
    auditLoggingEnabled: true,
    auditLogLevel: 'comprehensive' as 'basic' | 'detailed' | 'comprehensive',
    rbacEnabled: true,
    abacEnabled: true,
    mfaEnabled: true,
    authType: 'bearer' as 'none' | 'basic' | 'bearer' | 'oauth2' | 'saml',
    username: '',
    password: '',
    clientId: '',
    clientSecret: '',
    scope: 'fhir'
  });

  useEffect(() => {
    loadEndpoints();
  }, [organizationId]);

  const loadEndpoints = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/enterprise/fhir/endpoints?organizationId=${organizationId}`);
      const data = await response.json();
      
      if (data.success) {
        setEndpoints(data.endpoints);
      } else {
        setError(data.error?.message || 'Failed to load FHIR endpoints');
      }
    } catch (err) {
      setError('Failed to load FHIR endpoints');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/enterprise/fhir/endpoints', {
        method: editingEndpoint ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          organizationId,
          id: editingEndpoint?.id
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(editingEndpoint ? 'FHIR endpoint updated successfully' : 'FHIR endpoint created successfully');
        setShowAddEndpoint(false);
        setEditingEndpoint(null);
        resetForm();
        loadEndpoints();
      } else {
        setError(data.error?.message || 'Failed to save FHIR endpoint');
      }
    } catch (err) {
      setError('Failed to save FHIR endpoint');
    }
  };

  const handleEdit = (endpoint: FHIREndpoint) => {
    setEditingEndpoint(endpoint);
    setFormData({
      name: endpoint.name,
      baseUrl: endpoint.baseUrl,
      version: endpoint.version,
      hipaaCompliant: endpoint.healthcareCompliance.hipaaCompliant,
      dataEncryptionInTransit: endpoint.healthcareCompliance.dataEncryption.inTransit,
      dataEncryptionAtRest: endpoint.healthcareCompliance.dataEncryption.atRest,
      auditLoggingEnabled: endpoint.healthcareCompliance.auditLogging.enabled,
      auditLogLevel: endpoint.healthcareCompliance.auditLogging.logLevel,
      rbacEnabled: endpoint.healthcareCompliance.accessControls.rbac,
      abacEnabled: endpoint.healthcareCompliance.accessControls.abac,
      mfaEnabled: endpoint.healthcareCompliance.accessControls.mfa,
      authType: endpoint.authentication.type,
      username: endpoint.authentication.username || '',
      password: '',
      clientId: endpoint.authentication.clientId || '',
      clientSecret: '',
      scope: endpoint.authentication.scope || 'fhir'
    });
    setShowAddEndpoint(true);
  };

  const handleDelete = async (endpointId: string) => {
    if (!confirm('Are you sure you want to delete this FHIR endpoint?')) return;

    try {
      const response = await fetch(`/api/enterprise/fhir/endpoints/${endpointId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('FHIR endpoint deleted successfully');
        loadEndpoints();
      } else {
        setError(data.error?.message || 'Failed to delete FHIR endpoint');
      }
    } catch (err) {
      setError('Failed to delete FHIR endpoint');
    }
  };

  const handleTest = async (endpointId: string) => {
    try {
      setTestingEndpoint(endpointId);
      const response = await fetch(`/api/enterprise/fhir/endpoints/${endpointId}/test`, {
        method: 'POST',
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('FHIR endpoint test successful');
        loadEndpoints(); // Refresh to update status
      } else {
        setError(data.error?.message || 'FHIR endpoint test failed');
      }
    } catch (err) {
      setError('Failed to test FHIR endpoint');
    } finally {
      setTestingEndpoint(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      baseUrl: '',
      version: 'R4',
      hipaaCompliant: true,
      dataEncryptionInTransit: true,
      dataEncryptionAtRest: true,
      auditLoggingEnabled: true,
      auditLogLevel: 'comprehensive',
      rbacEnabled: true,
      abacEnabled: true,
      mfaEnabled: true,
      authType: 'bearer',
      username: '',
      password: '',
      clientId: '',
      clientSecret: '',
      scope: 'fhir'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'disconnected':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'testing':
        return <Activity className="h-4 w-4 text-blue-600 animate-pulse" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'disconnected':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'testing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplianceStatus = (endpoint: FHIREndpoint) => {
    const { hipaaCompliant, dataEncryption, auditLogging, accessControls } = endpoint.healthcareCompliance;
    
    if (hipaaCompliant && dataEncryption.inTransit && dataEncryption.atRest && auditLogging.enabled && accessControls.rbac) {
      return { status: 'compliant', label: 'HIPAA Compliant', color: 'green' };
    } else if (hipaaCompliant && (dataEncryption.inTransit || dataEncryption.atRest)) {
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
          <h2 className="text-2xl font-bold text-gray-900">FHIR Configuration</h2>
          <p className="text-gray-600">Manage FHIR R4-compliant healthcare data exchange endpoints</p>
        </div>
        <Button onClick={() => setShowAddEndpoint(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Endpoint
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
        {endpoints.map((endpoint) => {
          const compliance = getComplianceStatus(endpoint);
          return (
            <Card key={endpoint.id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Database className="h-8 w-8 text-blue-600" />
                    <div>
                      <CardTitle className="text-lg">{endpoint.name}</CardTitle>
                      <CardDescription>{endpoint.baseUrl} • FHIR {endpoint.version}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={compliance.color === 'green' ? 'default' : compliance.color === 'yellow' ? 'secondary' : 'destructive'}
                      className="bg-green-100 text-green-800"
                    >
                      {compliance.label}
                    </Badge>
                    {endpoint.isDefault && (
                      <Badge variant="outline">Default</Badge>
                    )}
                    <Badge 
                      variant="outline" 
                      className={getStatusColor(endpoint.status)}
                    >
                      {getStatusIcon(endpoint.status)}
                      <span className="ml-1 capitalize">{endpoint.status}</span>
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">HIPAA Compliance</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      {endpoint.healthcareCompliance.hipaaCompliant ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-sm">
                        {endpoint.healthcareCompliance.hipaaCompliant ? 'Compliant' : 'Non-Compliant'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Data Encryption</Label>
                    <div className="text-sm text-gray-600 mt-1">
                      {endpoint.healthcareCompliance.dataEncryption.inTransit ? 'In Transit ✓' : 'In Transit ✗'} • {' '}
                      {endpoint.healthcareCompliance.dataEncryption.atRest ? 'At Rest ✓' : 'At Rest ✗'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Audit Logging</Label>
                    <div className="text-sm text-gray-600 mt-1">
                      {endpoint.healthcareCompliance.auditLogging.enabled ? 'Enabled' : 'Disabled'} • {' '}
                      {endpoint.healthcareCompliance.auditLogging.logLevel}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Access Controls</Label>
                    <div className="text-sm text-gray-600 mt-1">
                      {endpoint.healthcareCompliance.accessControls.rbac ? 'RBAC ✓' : 'RBAC ✗'} • {' '}
                      {endpoint.healthcareCompliance.accessControls.mfa ? 'MFA ✓' : 'MFA ✗'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(endpoint)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTest(endpoint.id)}
                    disabled={testingEndpoint === endpoint.id}
                  >
                    {testingEndpoint === endpoint.id ? (
                      <Activity className="h-4 w-4 mr-2 animate-pulse" />
                    ) : (
                      <TestTube className="h-4 w-4 mr-2" />
                    )}
                    {testingEndpoint === endpoint.id ? 'Testing...' : 'Test'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(endpoint.id)}
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

      {showAddEndpoint && (
        <Card>
          <CardHeader>
            <CardTitle>{editingEndpoint ? 'Edit FHIR Endpoint' : 'Add New FHIR Endpoint'}</CardTitle>
            <CardDescription>
              Configure a new FHIR R4-compliant healthcare data exchange endpoint
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Settings</TabsTrigger>
                  <TabsTrigger value="security">Security & Compliance</TabsTrigger>
                  <TabsTrigger value="authentication">Authentication</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Endpoint Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Epic FHIR Server"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="baseUrl">Base URL</Label>
                      <Input
                        id="baseUrl"
                        value={formData.baseUrl}
                        onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                        placeholder="https://fhir.epic.com/interconnect-fhir-oauth"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="version">FHIR Version</Label>
                      <Select value={formData.version} onValueChange={(value: 'R4' | 'R5') => setFormData({ ...formData, version: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="R4">FHIR R4</SelectItem>
                          <SelectItem value="R5">FHIR R5</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="security" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="hipaaCompliant">HIPAA Compliance</Label>
                        <p className="text-sm text-gray-600">Ensure this endpoint meets HIPAA requirements</p>
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
                          onValueChange={(value: 'basic' | 'detailed' | 'comprehensive') => setFormData({ ...formData, auditLogLevel: value })}
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
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="rbacEnabled">Role-Based Access Control (RBAC)</Label>
                        <p className="text-sm text-gray-600">Enable role-based access control</p>
                      </div>
                      <Switch
                        id="rbacEnabled"
                        checked={formData.rbacEnabled}
                        onCheckedChange={(checked) => setFormData({ ...formData, rbacEnabled: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="mfaEnabled">Multi-Factor Authentication (MFA)</Label>
                        <p className="text-sm text-gray-600">Require multi-factor authentication</p>
                      </div>
                      <Switch
                        id="mfaEnabled"
                        checked={formData.mfaEnabled}
                        onCheckedChange={(checked) => setFormData({ ...formData, mfaEnabled: checked })}
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="authentication" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="authType">Authentication Type</Label>
                      <Select value={formData.authType} onValueChange={(value: 'none' | 'basic' | 'bearer' | 'oauth2' | 'saml') => setFormData({ ...formData, authType: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="basic">Basic Authentication</SelectItem>
                          <SelectItem value="bearer">Bearer Token</SelectItem>
                          <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                          <SelectItem value="saml">SAML</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {formData.authType === 'basic' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            placeholder="Username"
                          />
                        </div>
                        <div>
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="Password"
                          />
                        </div>
                      </div>
                    )}
                    
                    {formData.authType === 'oauth2' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="clientId">Client ID</Label>
                          <Input
                            id="clientId"
                            value={formData.clientId}
                            onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                            placeholder="OAuth Client ID"
                          />
                        </div>
                        <div>
                          <Label htmlFor="clientSecret">Client Secret</Label>
                          <Input
                            id="clientSecret"
                            type="password"
                            value={formData.clientSecret}
                            onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
                            placeholder="OAuth Client Secret"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="scope">Scope</Label>
                          <Input
                            id="scope"
                            value={formData.scope}
                            onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                            placeholder="fhir"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="flex items-center justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddEndpoint(false);
                    setEditingEndpoint(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingEndpoint ? 'Update Endpoint' : 'Create Endpoint'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}