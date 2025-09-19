/**
 * API Versioning Management Component
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  GitBranch, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Shield,
  ArrowRight,
  Play,
  RotateCcw,
  Plus
} from 'lucide-react';

interface APIVersion {
  id: string;
  version: string;
  major: number;
  minor: number;
  patch: number;
  status: 'current' | 'deprecated' | 'sunset' | 'retired';
  releaseDate: string;
  deprecationDate?: string;
  sunsetDate?: string;
  changelog: string;
  breakingChanges: any[];
  healthcareCompliance: {
    hipaaCompliant: boolean;
    fhirCompliant: boolean;
    auditRequired: boolean;
    dataEncryption: boolean;
    accessLogging: boolean;
  };
  backwardCompatibility: {
    isCompatible: boolean;
    compatibilityScore: number;
    supportedVersions: string[];
    deprecatedFeatures: string[];
    migrationRequired: boolean;
    estimatedMigrationTime: string;
  };
}

interface VersionMigration {
  id: string;
  fromVersion: string;
  toVersion: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  organizationId: string;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  migrationSteps: any[];
}

export default function APIVersioningComponent() {
  const [versions, setVersions] = useState<APIVersion[]>([]);
  const [migrations, setMigrations] = useState<VersionMigration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<APIVersion | null>(null);
  const [showCreateVersion, setShowCreateVersion] = useState(false);

  useEffect(() => {
    loadVersions();
    loadMigrations();
  }, []);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/enterprise/versioning');
      const data = await response.json();
      
      if (data.versions) {
        // Mock data for now
        setVersions([
          {
            id: '1',
            version: '1.0.0',
            major: 1,
            minor: 0,
            patch: 0,
            status: 'current',
            releaseDate: '2024-01-01',
            changelog: 'Initial release with basic healthcare API functionality',
            breakingChanges: [],
            healthcareCompliance: {
              hipaaCompliant: true,
              fhirCompliant: true,
              auditRequired: true,
              dataEncryption: true,
              accessLogging: true
            },
            backwardCompatibility: {
              isCompatible: true,
              compatibilityScore: 100,
              supportedVersions: ['1.0.0'],
              deprecatedFeatures: [],
              migrationRequired: false,
              estimatedMigrationTime: '0 minutes'
            }
          },
          {
            id: '2',
            version: '1.1.0',
            major: 1,
            minor: 1,
            patch: 0,
            status: 'current',
            releaseDate: '2024-02-01',
            changelog: 'Added FHIR R4 compliance and enhanced security features',
            breakingChanges: [],
            healthcareCompliance: {
              hipaaCompliant: true,
              fhirCompliant: true,
              auditRequired: true,
              dataEncryption: true,
              accessLogging: true
            },
            backwardCompatibility: {
              isCompatible: true,
              compatibilityScore: 95,
              supportedVersions: ['1.0.0', '1.1.0'],
              deprecatedFeatures: [],
              migrationRequired: false,
              estimatedMigrationTime: '15 minutes'
            }
          }
        ]);
      }
    } catch (err) {
      setError('Failed to load API versions');
    } finally {
      setLoading(false);
    }
  };

  const loadMigrations = async () => {
    try {
      // Mock data for now
      setMigrations([
        {
          id: '1',
          fromVersion: '1.0.0',
          toVersion: '1.1.0',
          status: 'completed',
          organizationId: 'org-123',
          startedAt: '2024-02-01T10:00:00Z',
          completedAt: '2024-02-01T10:15:00Z',
          migrationSteps: []
        }
      ]);
    } catch (err) {
      console.error('Failed to load migrations:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'current': return 'bg-green-100 text-green-800';
      case 'deprecated': return 'bg-yellow-100 text-yellow-800';
      case 'sunset': return 'bg-orange-100 text-orange-800';
      case 'retired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'current': return <CheckCircle className="h-4 w-4" />;
      case 'deprecated': return <AlertTriangle className="h-4 w-4" />;
      case 'sunset': return <Clock className="h-4 w-4" />;
      case 'retired': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getMigrationStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
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
          <h2 className="text-2xl font-bold text-gray-900">API Versioning</h2>
          <p className="text-gray-600">Manage API versions and backward compatibility</p>
        </div>
        <Button onClick={() => setShowCreateVersion(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Version
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="versions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="versions">Versions</TabsTrigger>
          <TabsTrigger value="migrations">Migrations</TabsTrigger>
          <TabsTrigger value="compatibility">Compatibility</TabsTrigger>
        </TabsList>

        <TabsContent value="versions" className="space-y-4">
          <div className="grid gap-4">
            {versions.map((version) => (
              <Card key={version.id} className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <GitBranch className="h-5 w-5 text-blue-600" />
                      <div>
                        <CardTitle className="text-lg">v{version.version}</CardTitle>
                        <CardDescription>
                          Released {new Date(version.releaseDate).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(version.status)}>
                        {getStatusIcon(version.status)}
                        <span className="ml-1 capitalize">{version.status}</span>
                      </Badge>
                      {version.healthcareCompliance.hipaaCompliant && (
                        <Badge variant="outline" className="text-green-600">
                          <Shield className="h-3 w-3 mr-1" />
                          HIPAA
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Changelog</Label>
                      <p className="text-sm text-gray-600 mt-1">{version.changelog}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Healthcare Compliance</Label>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center space-x-2">
                            {version.healthcareCompliance.hipaaCompliant ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                            )}
                            <span className="text-sm">HIPAA Compliant</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {version.healthcareCompliance.fhirCompliant ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                            )}
                            <span className="text-sm">FHIR Compliant</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Backward Compatibility</Label>
                        <div className="mt-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">Score: {version.backwardCompatibility.compatibilityScore}%</span>
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${version.backwardCompatibility.compatibilityScore}%` }}
                              ></div>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Migration: {version.backwardCompatibility.migrationRequired ? 'Required' : 'Not Required'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedVersion(version)}
                      >
                        View Details
                      </Button>
                      {version.status === 'current' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-yellow-600 hover:text-yellow-700"
                        >
                          Deprecate
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="migrations" className="space-y-4">
          <div className="space-y-4">
            {migrations.map((migration) => (
              <Card key={migration.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <ArrowRight className="h-5 w-5 text-blue-600" />
                      <div>
                        <CardTitle className="text-lg">
                          v{migration.fromVersion} → v{migration.toVersion}
                        </CardTitle>
                        <CardDescription>
                          Organization: {migration.organizationId}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getMigrationStatusColor(migration.status)}>
                        {migration.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {migration.status === 'in_progress' && <Play className="h-3 w-3 mr-1" />}
                        {migration.status === 'failed' && <AlertTriangle className="h-3 w-3 mr-1" />}
                        {migration.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                        <span className="capitalize">{migration.status}</span>
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {migration.startedAt && (
                      <div className="text-sm text-gray-600">
                        Started: {new Date(migration.startedAt).toLocaleString()}
                      </div>
                    )}
                    {migration.completedAt && (
                      <div className="text-sm text-gray-600">
                        Completed: {new Date(migration.completedAt).toLocaleString()}
                      </div>
                    )}
                    {migration.errorMessage && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{migration.errorMessage}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-4">
                    {migration.status === 'pending' && (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <Play className="h-4 w-4 mr-2" />
                        Execute
                      </Button>
                    )}
                    {migration.status === 'failed' && (
                      <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Retry
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="compatibility" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compatibility Checker</CardTitle>
              <CardDescription>
                Check backward compatibility between API versions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="from-version">From Version</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select version" />
                      </SelectTrigger>
                      <SelectContent>
                        {versions.map((version) => (
                          <SelectItem key={version.id} value={version.version}>
                            v{version.version}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="to-version">To Version</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select version" />
                      </SelectTrigger>
                      <SelectContent>
                        {versions.map((version) => (
                          <SelectItem key={version.id} value={version.version}>
                            v{version.version}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button className="w-full">
                  Check Compatibility
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
